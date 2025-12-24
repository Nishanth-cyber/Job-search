package Springboot.controller;

import Springboot.repository.JobRepository;
import Springboot.repository.UserRepository;
import Springboot.repository.ChallengeRepository;
import Springboot.repository.ChallengeSubmissionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/admin/dashboard")
@CrossOrigin(originPatterns = "${app.cors.allowed-origins:*}")
public class AdminDashboardController {

    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final ChallengeRepository challengeRepository;
    private final ChallengeSubmissionRepository submissionRepository;

    public AdminDashboardController(UserRepository userRepository,
                                    JobRepository jobRepository,
                                    ChallengeRepository challengeRepository,
                                    ChallengeSubmissionRepository submissionRepository) {
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
        this.challengeRepository = challengeRepository;
        this.submissionRepository = submissionRepository;
    }

    @GetMapping("/summary")
    public ResponseEntity<?> summary() {
        long users = userRepository.count();
        long jobs = jobRepository.count();
        long challenges = challengeRepository.count();
        long submissions = submissionRepository.count();
        return ResponseEntity.ok(Map.of(
                "users", users,
                "jobs", jobs,
                "challenges", challenges,
                "submissions", submissions
        ));
    }
}
