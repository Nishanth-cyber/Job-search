package Springboot.service;

import java.io.InputStream;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class N8NAnalysisService {

    @Value("${n8n_url}/resume-analysis")
    private String n8nWebhookUrl;

    @Autowired
    private FileStorageService fileStorageService;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public N8NAnalysisService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
        
        // Set timeout for N8N requests
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(30000);
        factory.setReadTimeout(60000);
        this.restTemplate.setRequestFactory(factory);
    }

    public N8NAnalysisResult analyzeResume(String fileId, String jobDescription) {
        InputStream fileInputStream = null;
        try {
            // Get the file content from storage
            fileInputStream = fileStorageService.getFileInputStream(fileId);
            if (fileInputStream == null) {
                return new N8NAnalysisResult(null, null, "Resume file not found");
            }

            // Read file bytes
            byte[] fileBytes;
            try (InputStream is = fileInputStream) {
                fileBytes = is.readAllBytes();
            }
            String fileName = fileStorageService.getFileName(fileId);
            String contentType = fileStorageService.getContentType(fileId);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            // Build multipart/form-data body: resume (file) + jobdescription (text)
            HttpHeaders fileHeaders = new HttpHeaders();
            fileHeaders.setContentType(MediaType.parseMediaType(contentType));
            fileHeaders.setContentDisposition(ContentDisposition.builder("form-data").name("resume").filename(fileName != null ? fileName : "file").build());

            ByteArrayResource fileResource = new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() { return fileName != null ? fileName : "file"; }
            };
            HttpEntity<ByteArrayResource> filePart = new HttpEntity<>(fileResource, fileHeaders);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("resume", filePart);
            body.add("jobdescription", jobDescription);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

            // Call N8N webhook
            ResponseEntity<Map> response = restTemplate.postForEntity(
                n8nWebhookUrl,
                request,
                Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> responseBody = response.getBody();
                if (responseBody == null) {
                    // Treat empty 200 as a success with no data; the application flow will proceed to READY_FOR_TEST
                    System.out.println("N8N webhook returned status=200 OK, body=<empty> (treated as success)");
                    return new N8NAnalysisResult(null, null, null);
                }

                try {
                    System.out.println("N8N webhook returned status=" + response.getStatusCode());
                    System.out.println("N8N webhook response body: " + objectMapper.writeValueAsString(responseBody));
                } catch (Exception je) {
                    System.out.println("N8N webhook response (toString): " + responseBody.toString());
                }

                // Extract fields from N8N response
                Integer score = null;
                String summary = null;
                java.util.List<String> keyStrengths = null;
                java.util.List<String> missingSkills = null;
                java.util.List<String> suggestionsList = null;
                String suggestions = null;

                if (responseBody.containsKey("score")) {
                    score = ((Number) responseBody.get("score")).intValue();
                }
                if (responseBody.containsKey("summary")) {
                    summary = String.valueOf(responseBody.get("summary"));
                }
                if (responseBody.containsKey("key_strengths") && responseBody.get("key_strengths") instanceof java.util.List) {
                    keyStrengths = (java.util.List<String>) responseBody.get("key_strengths");
                }
                if (responseBody.containsKey("missing_skills") && responseBody.get("missing_skills") instanceof java.util.List) {
                    missingSkills = (java.util.List<String>) responseBody.get("missing_skills");
                }
                if (responseBody.containsKey("suggestions") && responseBody.get("suggestions") instanceof java.util.List) {
                    suggestionsList = (java.util.List<String>) responseBody.get("suggestions");
                    suggestions = String.join("\n", suggestionsList);
                } else if (responseBody.containsKey("suggestions")) {
                    suggestions = String.valueOf(responseBody.get("suggestions"));
                }

                return new N8NAnalysisResult(score, suggestions, null, summary, keyStrengths, missingSkills, suggestionsList);
            } else {
                String bodyStr;
                try {
                    bodyStr = response.getBody() != null ? objectMapper.writeValueAsString(response.getBody()) : "<empty>";
                } catch (Exception je) {
                    bodyStr = "<unserializable>";
                }
                System.err.println("N8N webhook returned non-OK status=" + response.getStatusCode() + ", body=" + bodyStr);
                return new N8NAnalysisResult(null, null, "N8N service returned error: " + response.getStatusCode() + " - " + bodyStr);
            }

        } catch (Exception e) {
            return new N8NAnalysisResult(null, null, "Failed to call N8N service: " + e.getMessage());
        } finally {
            // Delete the file from storage after the N8N call
            try {
                fileStorageService.deleteFile(fileId);
                System.out.println("File deleted from storage after N8N call: " + fileId);
            } catch (Exception ex) {
                System.err.println("Failed to delete file after N8N call: " + ex.getMessage());
            }
        }
    }

    public void triggerAnalysis(String fileId, String jobDescription) {
        try {
            String webhookUrl = n8nWebhookUrl;

            // Get the file content from storage
            InputStream fileInputStream = fileStorageService.getFileInputStream(fileId);
            if (fileInputStream == null) {
                System.err.println("Resume file not found for trigger analysis");
                return;
            }

            // Read file bytes
            byte[] fileBytes;
            try (InputStream is = fileInputStream) {
                fileBytes = is.readAllBytes();
            }
            String fileName = fileStorageService.getFileName(fileId);
            String contentType = fileStorageService.getContentType(fileId);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            // Build multipart/form-data body: resume (file) + jobdescription (text)
            HttpHeaders fileHeaders = new HttpHeaders();
            fileHeaders.setContentType(MediaType.parseMediaType(contentType));
            fileHeaders.setContentDisposition(ContentDisposition.builder("form-data").name("resume").filename(fileName != null ? fileName : "file").build());

            ByteArrayResource fileResource = new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() { return fileName != null ? fileName : "file"; }
            };
            HttpEntity<ByteArrayResource> filePart = new HttpEntity<>(fileResource, fileHeaders);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("resume", filePart);
            body.add("jobdescription", jobDescription);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

            restTemplate.postForEntity(webhookUrl, request, String.class);
        } catch (Exception e) {
            // Log error but don't fail the application
            System.err.println("Failed to trigger N8N analysis: " + e.getMessage());
        } finally {
            // Ensure deletion happens after calling N8N
            try {
                fileStorageService.deleteFile(fileId);
                System.out.println("File deleted from storage after N8N call: " + fileId);
            } catch (Exception ex) {
                System.err.println("Failed to delete file after N8N call: " + ex.getMessage());
            }
        }
    }

    public static class N8NAnalysisResult {
        private final Integer score;
        private final String suggestions;
        private final String error;
        private final String summary;
        private final java.util.List<String> keyStrengths;
        private final java.util.List<String> missingSkills;
        private final java.util.List<String> suggestionsList;

        public N8NAnalysisResult(Integer score, String suggestions, String error) {
            this(score, suggestions, error, null, null, null, null);
        }

        public N8NAnalysisResult(Integer score, String suggestions, String error,
                                  String summary,
                                  java.util.List<String> keyStrengths,
                                  java.util.List<String> missingSkills,
                                  java.util.List<String> suggestionsList) {
            this.score = score;
            this.suggestions = suggestions;
            this.error = error;
            this.summary = summary;
            this.keyStrengths = keyStrengths;
            this.missingSkills = missingSkills;
            this.suggestionsList = suggestionsList;
        }

        public Integer getScore() { return score; }
        public String getSuggestions() { return suggestions; }
        public String getError() { return error; }
        public String getSummary() { return summary; }
        public java.util.List<String> getKeyStrengths() { return keyStrengths; }
        public java.util.List<String> getMissingSkills() { return missingSkills; }
        public java.util.List<String> getSuggestionsList() { return suggestionsList; }

        public boolean isSuccess() { return error == null; }
    }
}
