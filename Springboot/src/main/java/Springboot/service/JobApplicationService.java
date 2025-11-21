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
import java.util.Map;
import java.util.HashMap;

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
    private N8NAnalysisService n8nAnalysisService;

    @Autowired
    private JobService jobService;

    public JobApplicationModel createInitialApplication(String jobId, String jobSeekerId,
                                                       MultipartFile resumeFile, String coverLetter) {
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

            // Create initial application
            JobApplicationModel application = new JobApplicationModel();
            application.setJobId(jobId);
            application.setJobSeekerId(jobSeekerId);
            application.setCoverLetter(coverLetter);
            application.setJobTitle(jobModel.getTitle());
            application.setCompanyName(jobModel.getCompanyName());
            application.setJobSeekerName(jobSeekerModel.getFirstName() + " " + jobSeekerModel.getLastName());
            application.setJobSeekerEmail(jobSeekerModel.getEmail());
            application.setStatus("N8N_ANALYSIS");

            // Handle resume upload
            String resumeFileId = null;
            String resumeFileName = null;
            if (resumeFile != null && !resumeFile.isEmpty()) {
                // Store file in GridFS
                resumeFileId = fileStorageService.storeFile(resumeFile, jobSeekerId);
                resumeFileName = resumeFile.getOriginalFilename();
                application.setResumeFileId(resumeFileId);
                application.setResumeFileName(resumeFileName);
            } else {
                // Use existing resume from user profile if available
                if (jobSeekerModel.getResumeFileId() != null) {
                    resumeFileId = jobSeekerModel.getResumeFileId();
                    resumeFileName = jobSeekerModel.getResumeFileName();
                    application.setResumeFileId(resumeFileId);
                    application.setResumeFileName(resumeFileName);
                } else {
                    throw new RuntimeException("Please upload a resume or update your profile with a resume");
                }
            }

            // Save initial application
            JobApplicationModel savedApplication = jobApplicationRepository.save(application);

            // Perform N8N analysis synchronously and persist minimal results
            try {
                String jobDescription = jobModel.getDescription() + "\n\nRequirements:\n" + jobModel.getRequirements();
                
                // Call N8N service with fileId and jobDescription
                N8NAnalysisService.N8NAnalysisResult result = n8nAnalysisService.analyzeResume(savedApplication.getResumeFileId(), jobDescription);
                
                if (result.isSuccess()) {
                    savedApplication.setN8nScore(result.getScore());
                    // Do not store detailed fields (summary/strengths/missing/suggestions list)
                    savedApplication.setN8nSuggestions(null);
                    savedApplication.setN8nAnalysisCompleted(true);

                    // Enforce company threshold if set
                    Integer threshold = jobModel.getMinN8nScoreForTest();
                    if (threshold != null && result.getScore() != null && result.getScore() < threshold) {
                        savedApplication.setStatus("N8N_BELOW_THRESHOLD");
                    } else {
                        savedApplication.setStatus("READY_FOR_TEST");
                    }
                } else {
                    savedApplication.setN8nSuggestions(result.getError());
                    savedApplication.setN8nAnalysisCompleted(true);
                    savedApplication.setStatus("N8N_ERROR");
                }
                
                savedApplication = jobApplicationRepository.save(savedApplication);
            } catch (Exception e) {
                savedApplication.setN8nSuggestions("N8N analysis failed: " + e.getMessage());
                savedApplication.setN8nAnalysisCompleted(true);
                savedApplication.setStatus("N8N_ERROR");
                savedApplication = jobApplicationRepository.save(savedApplication);
            }

            return savedApplication;

        } catch (Exception e) {
            throw new RuntimeException("Failed to create initial application: " + e.getMessage(), e);
        }
    }

    public JobApplicationModel applyForJob(String jobId, String jobSeekerId,
                                           MultipartFile resumeFile, String coverLetter,
                                           Integer testScore) {
        try {
            // Find existing application that has completed N8N analysis
            Optional<JobApplicationModel> existingApplication = 
                jobApplicationRepository.findByJobIdAndJobSeekerId(jobId, jobSeekerId);
            
            if (existingApplication.isEmpty()) {
                throw new RuntimeException("No application found. Please submit your resume first.");
            }
            
            JobApplicationModel application = existingApplication.get();
            
            // Check if N8N analysis is completed
            if (!application.isN8nAnalysisCompleted()) {
                throw new RuntimeException("Resume analysis is still in progress. Please wait.");
            }
            
            if (!"READY_FOR_TEST".equals(application.getStatus())) {
                throw new RuntimeException("Application is not ready for test. Current status: " + application.getStatus());
            }
            
            // Get job details to check threshold
            JobModel job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
                
            // Update application with test results
            application.setTestScore(testScore);
            
            // Check if the test score meets or exceeds the threshold
            Integer threshold = job.getMinN8nScoreForTest();
            boolean meetsThreshold = (threshold == null) || (testScore != null && testScore >= threshold);
            
            // Set status based on threshold check
            if (meetsThreshold) {
                application.setPassedTest(true);
                application.setStatus("PENDING_REVIEW");
            } else {
                application.setPassedTest(false);
                application.setStatus("TEST_BELOW_THRESHOLD");
            }
            
            // Save updated application
            JobApplicationModel savedApplication = jobApplicationRepository.save(application);
            
            // Only increment application count if the test was passed
            if (meetsThreshold) {
                jobService.incrementApplicationCount(jobId);
            }
            
            return savedApplication;

        } catch (Exception e) {
            throw new RuntimeException("Failed to submit application: " + e.getMessage(), e);
        }
    }

    public boolean hasUserAppliedForJob(String jobId, String jobSeekerId) {
        Optional<JobApplicationModel> application = 
            jobApplicationRepository.findByJobIdAndJobSeekerId(jobId, jobSeekerId);
        return application.isPresent();
    }

    public List<JobApplicationModel> getApplicationsByJobSeeker(String jobSeekerId) {
        return jobApplicationRepository.findByJobSeekerId(jobSeekerId);
    }

    public List<JobApplicationModel> getApplicationsForJob(String jobId) {
        return jobApplicationRepository.findByJobId(jobId);
    }

    public List<JobApplicationModel> getQualifiedApplicationsForJob(String jobId) {
        return jobApplicationRepository.findByJobId(jobId).stream()
                .filter(app -> app.isN8nAnalysisCompleted() && app.getN8nScore() != null && app.getN8nScore() >= 70)
                .collect(java.util.stream.Collectors.toList());
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
        return jobApplicationRepository.findByJobId(jobId).stream()
                .filter(app -> app.isN8nAnalysisCompleted() && app.getN8nScore() != null && app.getN8nScore() >= 70)
                .count();
    }

    // Run N8N preview without persisting an application
    public Map<String, Object> previewAnalysis(String jobId, String jobSeekerId, MultipartFile resumeFile) {
        try {
            Optional<JobModel> job = jobRepository.findById(jobId);
            if (job.isEmpty() || !job.get().isActive()) {
                throw new RuntimeException("Job not found or no longer active");
            }

            JobModel jobModel = job.get();

            if (resumeFile == null || resumeFile.isEmpty()) {
                throw new RuntimeException("Please upload a resume for analysis");
            }

            // Store temporarily in GridFS; analyzeResume() will delete it in finally
            String tempFileId = fileStorageService.storeFile(resumeFile, jobSeekerId);

            String jobDescription = jobModel.getDescription() + "\n\nRequirements:\n" + jobModel.getRequirements();

            N8NAnalysisService.N8NAnalysisResult result = n8nAnalysisService.analyzeResume(tempFileId, jobDescription);

            Map<String, Object> resp = new HashMap<>();
            resp.put("n8nScore", result.getScore());
            resp.put("n8nSummary", result.getSummary());
            resp.put("n8nKeyStrengths", result.getKeyStrengths());
            resp.put("n8nMissingSkills", result.getMissingSkills());
            resp.put("n8nSuggestionsList", result.getSuggestionsList());
            resp.put("n8nSuggestions", result.getSuggestions());

            Integer threshold = jobModel.getMinN8nScoreForTest();
            boolean below = threshold != null && result.getScore() != null && result.getScore() < threshold;
            resp.put("eligible", !below);
            resp.put("threshold", threshold);
            resp.put("jobId", jobId);

            return resp;
        } catch (Exception e) {
            throw new RuntimeException("Preview analysis failed: " + e.getMessage(), e);
        }
    }
}
