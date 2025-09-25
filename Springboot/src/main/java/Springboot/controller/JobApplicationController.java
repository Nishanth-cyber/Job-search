package Springboot.controller;

import Springboot.model.JobApplicationModel;
import Springboot.model.JobModel;
import Springboot.model.UserModel;
import Springboot.repository.UserRepository;
import Springboot.service.JobApplicationService;
import Springboot.service.JobService;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/applications")
@CrossOrigin(origins = "http://localhost:5173")
public class JobApplicationController {

    private final JobApplicationService jobApplicationService;
    private final JobService jobService;
    private final UserRepository userRepository;

    public JobApplicationController(JobApplicationService jobApplicationService, JobService jobService, UserRepository userRepository) {
        this.jobApplicationService = jobApplicationService;
        this.jobService = jobService;
        this.userRepository = userRepository;
    }

    // Jobseeker applies to a job (multipart - with resume upload)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> apply(
            @RequestParam String jobId,
            @RequestPart(required = false) MultipartFile resume,
            @RequestParam(required = false) String coverLetter,
            @RequestParam Integer testScore
    ) {
        String jobSeekerId = getCurrentUserId();
        try {
            JobApplicationModel application = jobApplicationService.applyForJob(jobId, jobSeekerId, resume, coverLetter, testScore);
            return ResponseEntity.ok(application);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Jobseeker applies to a job (JSON - without resume upload in this request)
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> applyJson(@RequestBody ApplyRequest request) {
        String jobSeekerId = getCurrentUserId();
        try {
            JobApplicationModel application = jobApplicationService.applyForJob(request.getJobId(), jobSeekerId, null, request.getCoverLetter(), request.getTestScore());
            return ResponseEntity.ok(application);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Jobseeker views own applications
    @GetMapping("/me")
    public ResponseEntity<List<JobApplicationModel>> myApplications() {
        String jobSeekerId = getCurrentUserId();
        return ResponseEntity.ok(jobApplicationService.getApplicationsByJobSeeker(jobSeekerId));
    }

    // Admin views applications for a job they posted
    @GetMapping("/job/{jobId}")
    public ResponseEntity<?> applicationsForJob(@PathVariable String jobId) {
        String adminId = getCurrentUserId();
        Optional<JobModel> job = jobService.getJobById(jobId);
        if (job.isEmpty() || !job.get().getPostedBy().equals(adminId)) {
            return ResponseEntity.status(403).body("Forbidden: Not your job posting");
        }
        return ResponseEntity.ok(jobApplicationService.getApplicationsForJob(jobId));
    }

    // Admin updates application status
    @PatchMapping("/{applicationId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String applicationId, @RequestParam String status) {
        String adminId = getCurrentUserId();
        try {
            JobApplicationModel updated = jobApplicationService.updateApplicationStatus(applicationId, status, adminId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Get application by id (must be owner or admin of job)
    @GetMapping("/{applicationId}")
    public ResponseEntity<?> getApplication(@PathVariable String applicationId) {
        Optional<JobApplicationModel> app = jobApplicationService.getApplicationById(applicationId);
        if (app.isEmpty()) return ResponseEntity.notFound().build();
        String requesterId = getCurrentUserId();
        JobApplicationModel application = app.get();
        // if requester is jobseeker owner
        if (application.getJobSeekerId().equals(requesterId)) return ResponseEntity.ok(application);
        // if requester is admin who owns the job
        Optional<JobModel> job = jobService.getJobById(application.getJobId());
        if (job.isPresent() && job.get().getPostedBy().equals(requesterId)) return ResponseEntity.ok(application);
        return ResponseEntity.status(403).body("Forbidden");
    }

    // Jobseeker withdraws application
    @DeleteMapping("/{applicationId}")
    public ResponseEntity<?> withdraw(@PathVariable String applicationId) {
        String jobSeekerId = getCurrentUserId();
        try {
            jobApplicationService.withdrawApplication(applicationId, jobSeekerId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth != null ? (String) auth.getPrincipal() : null;
        if (email == null) throw new RuntimeException("Unauthorized");
        Optional<UserModel> user = userRepository.findByEmail(email);
        if (user.isEmpty()) throw new RuntimeException("User not found");
        return user.get().getId();
    }

    // Simple DTO for JSON application request
    public static class ApplyRequest {
        private String jobId;
        private String coverLetter;
        private Integer testScore;

        public String getJobId() {
            return jobId;
        }

        public void setJobId(String jobId) {
            this.jobId = jobId;
        }

        public String getCoverLetter() {
            return coverLetter;
        }

        public void setCoverLetter(String coverLetter) {
            this.coverLetter = coverLetter;
        }

        public Integer getTestScore() {
            return testScore;
        }

        public void setTestScore(Integer testScore) {
            this.testScore = testScore;
        }
    }
}
