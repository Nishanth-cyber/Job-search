package Springboot.service;

import Springboot.model.JobApplicationModel;
import Springboot.model.JobModel;
import Springboot.model.UserModel;
import Springboot.repository.JobApplicationRepository;
import Springboot.repository.JobRepository;
import Springboot.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;
import java.util.Optional;

@Service
public class JobApplicationService {

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private ResumeParsingService resumeParsingService;

    @Autowired
    private LLMAnalysisService llmAnalysisService;

    @Autowired
    private JobService jobService;

    public JobApplicationModel applyForJob(String jobId, String jobSeekerId,
                                           MultipartFile resumeFile, String coverLetter,
                                           Integer testScore) {
        try {
            // Validate job exists and is active
            Optional<JobModel> job = jobRepository.findById(jobId);
            if (job.isEmpty() || !job.get().isActive()) {
                throw new RuntimeException("Job not found or no longer active");
            }

            // Validate job seeker
            Optional<UserModel> jobSeeker = userRepository.findById(jobSeekerId);
            if (jobSeeker.isEmpty() || !"JOBSEEKER".equals(jobSeeker.get().getRole())) {
                throw new RuntimeException("Invalid job seeker");
            }

            // Check if already applied
            Optional<JobApplicationModel> existingApplication = 
                jobApplicationRepository.findByJobIdAndJobSeekerId(jobId, jobSeekerId);
            if (existingApplication.isPresent()) {
                throw new RuntimeException("You have already applied for this job");
            }

            JobModel jobModel = job.get();
            UserModel jobSeekerModel = jobSeeker.get();

            // Enforce resume test threshold if provided
            if (testScore == null) {
                throw new RuntimeException("Test score is required");
            }
            boolean passedTest = testScore >= jobModel.getSkillScoreThreshold();
            if (!passedTest) {
                throw new RuntimeException("Test score below threshold");
            }

            // Create application
            JobApplicationModel application = new JobApplicationModel();
            application.setJobId(jobId);
            application.setJobSeekerId(jobSeekerId);
            application.setCoverLetter(coverLetter);
            application.setTestScore(testScore);
            application.setPassedTest(true);
            application.setJobTitle(jobModel.getTitle());
            application.setCompanyName(jobModel.getCompanyName());
            application.setJobSeekerName(jobSeekerModel.getFirstName() + " " + jobSeekerModel.getLastName());
            application.setJobSeekerEmail(jobSeekerModel.getEmail());

            // Handle resume upload and parsing
            if (resumeFile != null && !resumeFile.isEmpty()) {
                // Validate file type
                if (!resumeParsingService.isSupportedFileType(resumeFile.getContentType())) {
                    throw new RuntimeException("Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files.");
                }

                // Store file in GridFS
                String fileId = fileStorageService.storeFile(resumeFile, jobSeekerId);
                application.setResumeFileId(fileId);
                application.setResumeFileName(resumeFile.getOriginalFilename());

                // Parse resume text
                String resumeText = resumeParsingService.parseResume(resumeFile);
                application.setResumeText(resumeText);

                // Analyze resume against job requirements using LLM
                LLMAnalysisService.SkillAnalysisResult analysisResult = 
                    llmAnalysisService.analyzeResumeAgainstJob(
                        resumeText, 
                        jobModel.getDescription(), 
                        jobModel.getRequiredSkills()
                    );

                application.setSkillScore(analysisResult.getScore());
                application.setSkillAnalysis(analysisResult.getFullAnalysis());

                // Check if passes initial screening
                boolean passedScreening = analysisResult.getScore() >= jobModel.getSkillScoreThreshold();
                application.setPassedInitialScreening(passedScreening);

                if (passedScreening) {
                    application.setStatus("UNDER_REVIEW");
                } else {
                    application.setStatus("REJECTED");
                }
            } else {
                // Use existing resume from user profile if available
                if (jobSeekerModel.getResumeFileId() != null) {
                    application.setResumeFileId(jobSeekerModel.getResumeFileId());
                    application.setResumeFileName(jobSeekerModel.getResumeFileName());

                    // Parse existing resume
                    try (InputStream resumeStream = fileStorageService.getFileInputStream(jobSeekerModel.getResumeFileId())) {
                        if (resumeStream != null) {
                            String resumeText = resumeParsingService.parseResume(resumeStream);
                            application.setResumeText(resumeText);

                            // Analyze resume
                            LLMAnalysisService.SkillAnalysisResult analysisResult = 
                                llmAnalysisService.analyzeResumeAgainstJob(
                                    resumeText, 
                                    jobModel.getDescription(), 
                                    jobModel.getRequiredSkills()
                                );

                            application.setSkillScore(analysisResult.getScore());
                            application.setSkillAnalysis(analysisResult.getFullAnalysis());

                            boolean passedScreening = analysisResult.getScore() >= jobModel.getSkillScoreThreshold();
                            application.setPassedInitialScreening(passedScreening);

                            if (passedScreening) {
                                application.setStatus("UNDER_REVIEW");
                            } else {
                                application.setStatus("REJECTED");
                            }
                        }
                    }
                } else {
                    throw new RuntimeException("Please upload a resume or update your profile with a resume");
                }
            }

            // Save application
            JobApplicationModel savedApplication = jobApplicationRepository.save(application);

            // Increment job application count
            jobService.incrementApplicationCount(jobId);

            return savedApplication;

        } catch (Exception e) {
            throw new RuntimeException("Failed to submit application: " + e.getMessage(), e);
        }
    }

    public List<JobApplicationModel> getApplicationsByJobSeeker(String jobSeekerId) {
        return jobApplicationRepository.findByJobSeekerId(jobSeekerId);
    }

    public List<JobApplicationModel> getApplicationsForJob(String jobId) {
        return jobApplicationRepository.findByJobId(jobId);
    }

    public List<JobApplicationModel> getQualifiedApplicationsForJob(String jobId) {
        return jobApplicationRepository.findByJobIdAndPassedInitialScreeningTrue(jobId);
    }

    public Optional<JobApplicationModel> getApplicationById(String applicationId) {
        return jobApplicationRepository.findById(applicationId);
    }

    public JobApplicationModel updateApplicationStatus(String applicationId, String newStatus, String adminId) {
        Optional<JobApplicationModel> application = jobApplicationRepository.findById(applicationId);
        if (application.isEmpty()) {
            throw new RuntimeException("Application not found");
        }

        JobApplicationModel app = application.get();
        
        // Verify admin owns the job
        Optional<JobModel> job = jobRepository.findById(app.getJobId());
        if (job.isEmpty() || !job.get().getPostedBy().equals(adminId)) {
            throw new RuntimeException("You can only update applications for your job postings");
        }

        app.setStatus(newStatus);
        return jobApplicationRepository.save(app);
    }

    public void withdrawApplication(String applicationId, String jobSeekerId) {
        Optional<JobApplicationModel> application = jobApplicationRepository.findById(applicationId);
        if (application.isEmpty()) {
            throw new RuntimeException("Application not found");
        }

        JobApplicationModel app = application.get();
        if (!app.getJobSeekerId().equals(jobSeekerId)) {
            throw new RuntimeException("You can only withdraw your own applications");
        }

        if ("HIRED".equals(app.getStatus())) {
            throw new RuntimeException("Cannot withdraw an application that has been accepted");
        }

        jobApplicationRepository.deleteById(applicationId);
    }

    public long getApplicationCountForJob(String jobId) {
        return jobApplicationRepository.countByJobId(jobId);
    }

    public long getQualifiedApplicationCountForJob(String jobId) {
        return jobApplicationRepository.countByJobIdAndPassedInitialScreeningTrue(jobId);
    }
}
