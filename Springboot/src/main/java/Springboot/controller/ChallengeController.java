package Springboot.controller;

import Springboot.model.ChallengeModel;
import Springboot.model.ChallengeSubmissionModel;
import Springboot.model.UserModel;
import Springboot.repository.UserRepository;
import Springboot.service.ChallengeService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/challenges")
@CrossOrigin(origins = "http://localhost:5173")
public class ChallengeController {

    private static final Logger log = LoggerFactory.getLogger(ChallengeController.class);

    private final ChallengeService challengeService;
    private final UserRepository userRepository;

    public ChallengeController(ChallengeService challengeService, UserRepository userRepository) {
        this.challengeService = challengeService;
        this.userRepository = userRepository;
    }

    // Public list with optional q param
    @GetMapping
    public ResponseEntity<List<ChallengeModel>> list(@RequestParam(value = "q", required = false) String q) {
        return ResponseEntity.ok(challengeService.list(q));
    }

    // Public detail
    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable String id) {
        Optional<ChallengeModel> c = challengeService.getById(id);
        return c.<ResponseEntity<?>>map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Recruiter/Admin create
    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody ChallengeModel body) {
        try {
            String userId = getCurrentUserId();
            body.setCreatedByUserId(userId);
            if (body.getSummary() == null || body.getSummary().isBlank()) {
                String desc = body.getDescription();
                if (desc != null) {
                    body.setSummary(desc.substring(0, Math.min(200, desc.length())));
                }
            }
            ChallengeModel created = challengeService.create(body);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    public static class SubmitRequest {
        private String content;
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }

    // Jobseeker submits solution
    @PostMapping("/{id}/submit")
    public ResponseEntity<?> submit(@PathVariable String id, @RequestBody SubmitRequest req) {
        try {
            String userId = getCurrentUserId();
            if (req == null || req.getContent() == null || req.getContent().isBlank()) {
                return ResponseEntity.badRequest().body("Content is required");
            }
            // Resolve submitter details
            UserModel submitter = userRepository.findById(userId).orElse(null);
            String email = submitter != null ? submitter.getEmail() : null;
            String name = submitter != null ? (submitter.getUsername() != null ? submitter.getUsername() : (submitter.getFirstName() != null ? submitter.getFirstName() : null)) : null;
            ChallengeSubmissionModel s = challengeService.submit(id, userId, email, name, req.getContent());
            return ResponseEntity.ok(Map.of("id", s.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Recruiter: view submissions for own challenge
    @GetMapping("/{id}/submissions")
    public ResponseEntity<?> submissions(@PathVariable String id) {
        try {
            String requesterId = getCurrentUserId();
            Optional<ChallengeModel> challengeOpt = challengeService.getById(id);
            if (challengeOpt.isEmpty()) return ResponseEntity.notFound().build();
            ChallengeModel c = challengeOpt.get();
            if (c.getCreatedByUserId() == null || !c.getCreatedByUserId().equals(requesterId)) {
                return ResponseEntity.status(403).body("Forbidden: Only the challenge owner can view submissions");
            }
            return ResponseEntity.ok(challengeService.submissionsForChallenge(id));
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
        log.debug("Resolved current user email={} to id={}", email, user.get().getId());
        return user.get().getId();
    }
}
