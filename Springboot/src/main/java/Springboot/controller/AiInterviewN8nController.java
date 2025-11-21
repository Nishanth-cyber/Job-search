package Springboot.controller;

import Springboot.model.UserModel;
import Springboot.model.JobModel;
import Springboot.repository.UserRepository;
import Springboot.repository.JobRepository;
import Springboot.service.FileStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/ai-interview")
@CrossOrigin(origins = "http://localhost:5173")
public class AiInterviewN8nController {

    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final FileStorageService fileStorageService;
    private final WebClient webClient;

    @Value("${n8n.interview.questions.url:http://localhost:5678/webhook-test/interview-question}")
    private String n8nQuestionsUrl;

    @Value("${n8n.interview.evaluate.url:http://localhost:5678/webhook/interview-evaluate}")
    private String n8nEvaluateUrl;

    public AiInterviewN8nController(UserRepository userRepository,
                                    JobRepository jobRepository,
                                    FileStorageService fileStorageService) {
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
        this.fileStorageService = fileStorageService;
        this.webClient = WebClient.builder().build();
    }

    public static class QuestionsRequest {
        public String jobId;           // optional
        public String jobDescription;  // optional
    }

    @PostMapping(value = "/questions", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> generateQuestions(@RequestBody QuestionsRequest req) {
        try {
            UserModel me = requireCurrentUser();
            if (me.getResumeFileId() == null) {
                return ResponseEntity.badRequest().body("Resume not uploaded for current user");
            }

            String jd = req.jobDescription;
            if ((jd == null || jd.isBlank()) && req.jobId != null) {
                Optional<JobModel> job = jobRepository.findById(req.jobId);
                jd = job.map(JobModel::getDescription).orElse("");
            }

            // Load resume binary from GridFS
            Resource resumeRes = fileStorageService.getFile(me.getResumeFileId());
            if (resumeRes == null) return ResponseEntity.badRequest().body("Resume file not found");
            byte[] bytes;
            try (InputStream is = resumeRes.getInputStream()) {
                bytes = is.readAllBytes();
            }
            ByteArrayResource resumePart = new ByteArrayResource(bytes) {
                @Override
                public String getFilename() { return me.getResumeFileName() != null ? me.getResumeFileName() : "resume.pdf"; }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("resume", resumePart);
            body.add("jobdescription", jd != null ? jd : "");

            Map<?, ?> n8n = webClient.post()
                    .uri(n8nQuestionsUrl)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(body))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            return ResponseEntity.ok(n8n != null ? n8n : Map.of("questions", new String[]{}));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    public static class EvaluateRequest {
        public String jobId;           // optional
        public String jobDescription;  // optional
        public Map<String, String> history; // required
    }

    @PostMapping(value = "/evaluate", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> evaluateInterview(@RequestBody EvaluateRequest req) {
        try {
            UserModel me = requireCurrentUser();
            if (me.getResumeFileId() == null) {
                return ResponseEntity.badRequest().body("Resume not uploaded for current user");
            }

            String jd = req.jobDescription;
            if ((jd == null || jd.isBlank()) && req.jobId != null) {
                Optional<JobModel> job = jobRepository.findById(req.jobId);
                jd = job.map(JobModel::getDescription).orElse("");
            }

            if (req.history == null) req.history = new HashMap<>();

            // Prepare multipart with resume file and a JSON part for metadata
            Resource resumeRes = fileStorageService.getFile(me.getResumeFileId());
            if (resumeRes == null) return ResponseEntity.badRequest().body("Resume file not found");
            byte[] bytes;
            try (InputStream is = resumeRes.getInputStream()) {
                bytes = is.readAllBytes();
            }
            ByteArrayResource resumePart = new ByteArrayResource(bytes) {
                @Override
                public String getFilename() { return me.getResumeFileName() != null ? me.getResumeFileName() : "resume.pdf"; }
            };

            // history JSON as a string field
            String historyJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(req.history);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("resume", resumePart);
            body.add("jobdescription", jd != null ? jd : "");
            body.add("history", historyJson);

            Map<?, ?> n8n = webClient.post()
                    .uri(n8nEvaluateUrl)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(body))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            return ResponseEntity.ok(n8n != null ? n8n : Map.of());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private UserModel requireCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth != null ? (String) auth.getPrincipal() : null;
        if (email == null) throw new RuntimeException("Unauthorized");
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }
}
