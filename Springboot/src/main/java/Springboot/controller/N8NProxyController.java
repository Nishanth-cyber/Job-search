package Springboot.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/n8n")
@CrossOrigin(originPatterns = "${app.cors.allowed-origins:*}")
public class N8NProxyController {

    private final WebClient webClient;

    private final String resumeAnalysisUrl;
    private final String interviewQuestionUrl;
    private final String interviewEvaluateUrl;

    public N8NProxyController(@Value("${n8n_url:}") String n8nBase) {
        if (n8nBase == null || n8nBase.isBlank()) {
            this.webClient = null;
            this.resumeAnalysisUrl = null;
            this.interviewQuestionUrl = null;
            this.interviewEvaluateUrl = null;
            return;
        }
        String base = n8nBase.endsWith("/") ? n8nBase.substring(0, n8nBase.length() - 1) : n8nBase;
        this.resumeAnalysisUrl = base + "/resume-analysis";
        this.interviewQuestionUrl = base + "/interview-question";
        this.interviewEvaluateUrl = base + "/interview-evaluate";
        this.webClient = WebClient.builder()
                .baseUrl(base)
                .build();
    }

    private Mono<ResponseEntity<String>> missingConfigResponse() {
        return Mono.just(ResponseEntity.status(503).body("N8N base URL not configured"));
    }

    @PostMapping(value = "/resume-analysis", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseEntity<String>> resumeAnalysis(@RequestPart("resume") MultipartFile resume,
                                                       @RequestPart(value = "jobdescription", required = false) String jobdescription) {
        if (webClient == null || resumeAnalysisUrl == null) {
            return missingConfigResponse();
        }
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("resume", resume.getResource())
                .filename(resume.getOriginalFilename())
                .contentType(resume.getContentType() != null ? MediaType.parseMediaType(resume.getContentType()) : MediaType.APPLICATION_OCTET_STREAM);
        builder.part("jobdescription", jobdescription == null ? "" : jobdescription)
               .contentType(MediaType.TEXT_PLAIN);

        return webClient.post()
                .uri(resumeAnalysisUrl)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .exchangeToMono(clientResp -> clientResp.toEntity(String.class));
    }

    @PostMapping(value = "/interview-question", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseEntity<String>> interviewQuestion(@RequestPart("resume") MultipartFile resume,
                                                          @RequestPart(value = "jobdescription", required = false) String jobdescription) {
        if (webClient == null || interviewQuestionUrl == null) {
            return missingConfigResponse();
        }
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("resume", resume.getResource())
                .filename(resume.getOriginalFilename())
                .contentType(resume.getContentType() != null ? MediaType.parseMediaType(resume.getContentType()) : MediaType.APPLICATION_OCTET_STREAM);
        builder.part("jobdescription", jobdescription == null ? "" : jobdescription)
               .contentType(MediaType.TEXT_PLAIN);

        return webClient.post()
                .uri(interviewQuestionUrl)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .exchangeToMono(clientResp -> clientResp.toEntity(String.class));
    }

    @PostMapping(value = "/interview-evaluate", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<String>> interviewEvaluate(@RequestBody String payload) {
        if (webClient == null || interviewEvaluateUrl == null) {
            return missingConfigResponse();
        }
        return webClient.post()
                .uri(interviewEvaluateUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .exchangeToMono(clientResp -> clientResp.toEntity(String.class));
    }
}
