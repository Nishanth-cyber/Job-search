package Springboot.service;

import Springboot.model.JobModel;
import Springboot.model.UserModel;
import Springboot.repository.JobRepository;
import Springboot.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class JobService {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    private static final Logger log = LoggerFactory.getLogger(JobService.class);

    public JobModel createJob(JobModel job, String adminId) {
        // Verify admin user
        Optional<UserModel> admin = userRepository.findById(adminId);
        if (admin.isEmpty() || !"ADMIN".equals(admin.get().getRole())) {
            throw new RuntimeException("Only admins can create jobs");
        }

        // Set admin details
        UserModel adminUser = admin.get();
        job.setPostedBy(adminId);
        // Determine companyName (must be non-blank per validation)
        String resolvedCompanyName = firstNonBlank(
                adminUser.getCompanyName(),
                job.getCompanyName(),
                adminUser.getUsername()
        );
        job.setCompanyName(resolvedCompanyName);
        // Optional company details (copy from admin when present; otherwise keep provided payload values)
        if (isNotBlank(adminUser.getCompanyDescription())) job.setCompanyDescription(adminUser.getCompanyDescription());
        if (isNotBlank(adminUser.getCompanyWebsite())) job.setCompanyWebsite(adminUser.getCompanyWebsite());
        if (isNotBlank(adminUser.getCompanySize())) job.setCompanySize(adminUser.getCompanySize());
        if (isNotBlank(adminUser.getIndustry())) job.setIndustry(adminUser.getIndustry());

        log.debug("Creating job title={} companyName={} postedBy={} ", job.getTitle(), job.getCompanyName(), job.getPostedBy());

        return jobRepository.save(job);
    }

    public List<JobModel> getAllActiveJobs() {
        return jobRepository.findByIsActiveTrue();
    }

    public List<JobModel> getJobsByAdmin(String adminId) {
        return jobRepository.findByPostedBy(adminId);
    }

    public Optional<JobModel> getJobById(String jobId) {
        return jobRepository.findById(jobId);
    }

    public JobModel updateJob(String jobId, JobModel updatedJob, String adminId) {
        Optional<JobModel> existingJob = jobRepository.findById(jobId);
        if (existingJob.isEmpty()) {
            throw new RuntimeException("Job not found");
        }

        JobModel job = existingJob.get();
        if (!job.getPostedBy().equals(adminId)) {
            throw new RuntimeException("You can only update your own job postings");
        }

        // Update fields
        job.setTitle(updatedJob.getTitle());
        job.setDescription(updatedJob.getDescription());
        job.setLocation(updatedJob.getLocation());
        job.setJobType(updatedJob.getJobType());
        job.setExperienceLevel(updatedJob.getExperienceLevel());
        job.setSalaryMin(updatedJob.getSalaryMin());
        job.setSalaryMax(updatedJob.getSalaryMax());
        job.setRequiredSkills(updatedJob.getRequiredSkills());
        job.setPreferredSkills(updatedJob.getPreferredSkills());
        job.setRequirements(updatedJob.getRequirements());
        job.setBenefits(updatedJob.getBenefits());
        job.setApplicationDeadline(updatedJob.getApplicationDeadline());
        job.setSkillScoreThreshold(updatedJob.getSkillScoreThreshold());
        job.setUpdatedAt(LocalDateTime.now());

        return jobRepository.save(job);
    }

    public void deleteJob(String jobId, String adminId) {
        Optional<JobModel> job = jobRepository.findById(jobId);
        if (job.isEmpty()) {
            throw new RuntimeException("Job not found");
        }

        if (!job.get().getPostedBy().equals(adminId)) {
            throw new RuntimeException("You can only delete your own job postings");
        }

        jobRepository.deleteById(jobId);
    }

    public void deactivateJob(String jobId, String adminId) {
        Optional<JobModel> existingJob = jobRepository.findById(jobId);
        if (existingJob.isEmpty()) {
            throw new RuntimeException("Job not found");
        }

        JobModel job = existingJob.get();
        if (!job.getPostedBy().equals(adminId)) {
            throw new RuntimeException("You can only deactivate your own job postings");
        }

        job.setActive(false);
        job.setUpdatedAt(LocalDateTime.now());
        jobRepository.save(job);
    }

    public List<JobModel> searchJobs(String keyword, String location, String jobType, String experienceLevel) {
        if (keyword != null && !keyword.isEmpty()) {
            return jobRepository.findByTitleContainingIgnoreCase(keyword);
        }
        
        if (location != null && !location.isEmpty()) {
            return jobRepository.findByLocationContainingIgnoreCase(location);
        }
        
        if (jobType != null && !jobType.isEmpty()) {
            return jobRepository.findByJobTypeAndIsActiveTrue(jobType);
        }
        
        if (experienceLevel != null && !experienceLevel.isEmpty()) {
            return jobRepository.findByExperienceLevelAndIsActiveTrue(experienceLevel);
        }
        
        return getAllActiveJobs();
    }

    public List<JobModel> getJobsBySkills(List<String> skills) {
        return jobRepository.findByRequiredSkillsIn(skills);
    }

    public void incrementApplicationCount(String jobId) {
        Optional<JobModel> job = jobRepository.findById(jobId);
        if (job.isPresent()) {
            JobModel jobModel = job.get();
            jobModel.setApplicationCount(jobModel.getApplicationCount() + 1);
            jobRepository.save(jobModel);
        }
    }

    private static boolean isNotBlank(String s) {
        return s != null && !s.trim().isEmpty();
    }

    private static String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String v : values) {
            if (v != null && !v.trim().isEmpty()) return v.trim();
        }
        return null;
    }
}
