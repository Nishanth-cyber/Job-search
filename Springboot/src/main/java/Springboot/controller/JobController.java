package Springboot.controller;

import Springboot.model.JobModel;
import Springboot.model.UserModel;
import Springboot.repository.UserRepository;
import Springboot.service.JobService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/jobs")
@CrossOrigin(originPatterns = "${app.cors.allowed-origins:*}")
public class JobController {

    private final JobService jobService;
    private final UserRepository userRepository;
        private static final Logger log = LoggerFactory.getLogger(JobController.class);

    public JobController(JobService jobService, UserRepository userRepository) {
        this.jobService = jobService;
        this.userRepository = userRepository;
    }

    // Public endpoints
    @GetMapping
    public ResponseEntity<List<JobModel>> getAllActiveJobs() {
        return ResponseEntity.ok(jobService.getAllActiveJobs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getJobById(@PathVariable String id) {
        Optional<JobModel> job = jobService.getJobById(id);
        return job.<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public ResponseEntity<List<JobModel>> searchJobs(@RequestParam(required = false) String keyword,
                                                     @RequestParam(required = false) String location,
                                                     @RequestParam(required = false) String jobType,
                                                     @RequestParam(required = false) String experienceLevel) {
        return ResponseEntity.ok(jobService.searchJobs(keyword, location, jobType, experienceLevel));
    }

    // Public: simple generated test questions for a job posting
    @GetMapping("/{id}/test-questions")
    public ResponseEntity<?> getTestQuestions(@PathVariable String id) {
        Optional<JobModel> jobOpt = jobService.getJobById(id);
        if (jobOpt.isEmpty()) return ResponseEntity.notFound().build();
        JobModel j = jobOpt.get();
        String title = j.getTitle() != null ? j.getTitle() : "this role";
        String techs = (j.getRequiredSkills() != null && !j.getRequiredSkills().isEmpty()) ? String.join(", ", j.getRequiredSkills()) : "the required technologies";
        List<String> qs = List.of(
                "Describe a project relevant to " + title + ": goals, your role, and outcomes.",
                "Explain how you would design a scalable solution using " + techs + ".",
                "Walk through how you debug performance problems in production services.",
                "What trade-offs would you consider when selecting frameworks for this job?",
                "Share a challenging technical problem you solved recently and what you learned."
        );
        return ResponseEntity.ok(qs);
    }

    // Admin endpoints
    @GetMapping("/mine")
    public ResponseEntity<?> myJobs() {
        String adminId = getCurrentUserId();
        try {
            return ResponseEntity.ok(jobService.getJobsByAdmin(adminId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createJob(@Valid @RequestBody JobModel job) {
        try {
            String adminId = getCurrentUserId();
            log.info("Create job request by adminId={} title={} location={} jobType={}", adminId, job.getTitle(), job.getLocation(), job.getJobType());
            JobModel created = jobService.createJob(job, adminId);
            log.info("Job created with id={} by adminId={}", created.getId(), adminId);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            log.warn("Create job failed: {}", e.getMessage());
            if ("Unauthorized".equals(e.getMessage()) || "User not found".equals(e.getMessage())) {
                return ResponseEntity.status(401).body(e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateJob(@PathVariable String id, @Valid @RequestBody JobModel job) {
        try {
            String adminId = getCurrentUserId();
            JobModel updated = jobService.updateJob(id, job, adminId);
            log.info("Job updated id={} by adminId={}", id, adminId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.warn("Update job failed id={}: {}", id, e.getMessage());
            if ("Unauthorized".equals(e.getMessage()) || "User not found".equals(e.getMessage())) {
                return ResponseEntity.status(401).body(e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteJob(@PathVariable String id) {
        try {
            String adminId = getCurrentUserId();
            jobService.deleteJob(id, adminId);
            log.info("Job deleted id={} by adminId={}", id, adminId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.warn("Delete job failed id={}: {}", id, e.getMessage());
            if ("Unauthorized".equals(e.getMessage()) || "User not found".equals(e.getMessage())) {
                return ResponseEntity.status(401).body(e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<?> deactivateJob(@PathVariable String id) {
        try {
            String adminId = getCurrentUserId();
            jobService.deactivateJob(id, adminId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            if ("Unauthorized".equals(e.getMessage()) || "User not found".equals(e.getMessage())) {
                return ResponseEntity.status(401).body(e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth != null ? (String) auth.getPrincipal() : null;
        if (email == null) throw new RuntimeException("Unauthorized");
        Optional<UserModel> user = userRepository.findByEmail(email);
        if (user.isEmpty()) throw new RuntimeException("User not found");
        log.debug("Resolved current user email={} to id={}", email, user.get().getId());
        return user.get().getId();
    }

}
