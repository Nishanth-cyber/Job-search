package Springboot.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;

@Service
public class LLMAnalysisService {

    @Value("${openrouter.api.key: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}")
    private String apiKey;

    @Value("${openrouter.api.url:https://openrouter.ai/api/v1/chat/completions}")
    private String apiUrl;

    private final WebClient webClient;

    public LLMAnalysisService() {
        this.webClient = WebClient.builder()
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024)) // 10MB
                .build();
    }

    /**
     * Generate 5 interview-style questions tailored to the job using the LLM.
     * Falls back to simple skills-based prompts if the LLM call fails.
     */
    public List<String> generateQuestions(String jobDescription, List<String> requiredSkills) {
        try {
            String prompt = String.format("""
                You are an HR assistant. Based on the job description and required skills, craft 5 concise, practical questions
                to quickly evaluate a candidate's fit. Return ONLY the questions, one per line, no numbering, no extra text.

                JOB DESCRIPTION:
                %s

                REQUIRED SKILLS:
                %s
                """,
                jobDescription,
                String.join(", ", requiredSkills == null ? List.of() : requiredSkills)
            );

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "anthropic/claude-3.5-sonnet");
            List<Map<String, String>> messages = new ArrayList<>();
            Map<String, String> message = new HashMap<>();
            message.put("role", "user");
            message.put("content", prompt);
            messages.add(message);
            requestBody.put("messages", messages);
            requestBody.put("max_tokens", 400);
            requestBody.put("temperature", 0.3);

            Mono<Map> response = webClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class);

            Map<String, Object> result = response.block();
            if (result != null && result.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) result.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> choice = choices.get(0);
                    Map<String, String> messageContent = (Map<String, String>) choice.get("message");
                    String text = messageContent.get("content");
                    if (text != null) {
                        String[] lines = text.trim().split("\n+");
                        List<String> qs = new ArrayList<>();
                        for (String l : lines) {
                            String cleaned = l.replaceAll("^\\s*Q?\\d+[:.)]\\s*", "").trim();
                            if (!cleaned.isEmpty()) qs.add(cleaned);
                            if (qs.size() == 5) break;
                        }
                        if (!qs.isEmpty()) return qs.size() >= 5 ? qs.subList(0, 5) : padWithFallback(qs, requiredSkills);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("LLM question generation failed: " + e.getMessage());
        }
        // Fallback
        return defaultQuestions(requiredSkills);
    }

    private List<String> defaultQuestions(List<String> requiredSkills) {
        List<String> qs = new ArrayList<>();
        List<String> skills = requiredSkills == null ? List.of() : requiredSkills;
        for (String s : skills) {
            if (qs.size() == 5) break;
            qs.add("Explain your experience with " + s + ".");
        }
        return padWithFallback(qs, skills);
    }

    private List<String> padWithFallback(List<String> base, List<String> skills) {
        List<String> out = new ArrayList<>(base);
        List<String> fallback = List.of(
                "Summarize your most relevant project for this role.",
                "Describe a recent technical challenge you solved and how.",
                "How do you keep your skills up to date?",
                "Outline your approach to debugging complex issues.",
                "Why are you a good fit for this position?"
        );
        for (String f : fallback) {
            if (out.size() == 5) break;
            out.add(f);
        }
        return out.size() > 5 ? out.subList(0, 5) : out;
    }

    /**
     * Evaluate candidate answers 0-100 using LLM, with a robust fallback heuristic.
     */
    public int evaluateAnswers(String jobDescription, List<String> requiredSkills, List<String> answers) {
        try {
            String prompt = String.format("""
                You are an HR evaluator. Given the job description and required skills, rate the candidate's 5 short answers
                on a scale from 0 to 100 for overall fit and relevance. Consider correctness, depth, clarity, and alignment
                with the required skills. Respond with ONLY the number (0-100), no extra text.

                JOB DESCRIPTION:
                %s

                REQUIRED SKILLS:
                %s

                ANSWERS:
                1) %s
                2) %s
                3) %s
                4) %s
                5) %s
                """,
                jobDescription,
                String.join(", ", requiredSkills == null ? List.of() : requiredSkills),
                safeIndex(answers, 0), safeIndex(answers, 1), safeIndex(answers, 2), safeIndex(answers, 3), safeIndex(answers, 4)
            );

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "anthropic/claude-3.5-sonnet");
            List<Map<String, String>> messages = new ArrayList<>();
            Map<String, String> message = new HashMap<>();
            message.put("role", "user");
            message.put("content", prompt);
            messages.add(message);
            requestBody.put("messages", messages);
            requestBody.put("max_tokens", 50);
            requestBody.put("temperature", 0.2);

            Mono<Map> response = webClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class);
            Map<String, Object> result = response.block();
            if (result != null && result.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) result.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> choice = choices.get(0);
                    Map<String, String> messageContent = (Map<String, String>) choice.get("message");
                    String text = messageContent.get("content");
                    if (text != null) {
                        String digits = text.replaceAll("[^0-9]", "");
                        if (!digits.isEmpty()) {
                            int score = Integer.parseInt(digits);
                            return Math.max(0, Math.min(100, score));
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("LLM evaluation failed: " + e.getMessage());
        }
        // Fallback heuristic: number of answers with >= 40 chars and containing skills
        int longCount = 0;
        int skillHits = 0;
        List<String> skills = requiredSkills == null ? List.of() : requiredSkills;
        for (String a : answers) {
            if (a != null) {
                if (a.trim().length() >= 40) longCount++;
                String lower = a.toLowerCase();
                for (String s : skills) {
                    if (lower.contains((s == null ? "" : s).toLowerCase())) {
                        skillHits++;
                        break;
                    }
                }
            }
        }
        int base = Math.round((longCount / 5f) * 60); // up to 60 points for completeness
        int bonus = Math.min(40, skillHits * 8);       // up to 40 for matching skills
        return Math.min(100, base + bonus);
    }

    private String safeIndex(List<String> list, int i) {
        if (list == null || i >= list.size() || i < 0) return "";
        return list.get(i) == null ? "" : list.get(i);
    }

    public SkillAnalysisResult analyzeResumeAgainstJob(String resumeText, String jobDescription, 
                                                      List<String> requiredSkills) {
        try {
            String prompt = buildAnalysisPrompt(resumeText, jobDescription, requiredSkills);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "anthropic/claude-3.5-sonnet");
            
            List<Map<String, String>> messages = new ArrayList<>();
            Map<String, String> message = new HashMap<>();
            message.put("role", "user");
            message.put("content", prompt);
            messages.add(message);
            
            requestBody.put("messages", messages);
            requestBody.put("max_tokens", 1000);
            requestBody.put("temperature", 0.3);

            Mono<Map> response = webClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class);

            Map<String, Object> result = response.block();
            
            if (result != null && result.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) result.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> choice = choices.get(0);
                    Map<String, String> messageContent = (Map<String, String>) choice.get("message");
                    String analysisText = messageContent.get("content");
                    
                    return parseAnalysisResult(analysisText);
                }
            }
            
            // Fallback to basic analysis if LLM fails
            return performBasicAnalysis(resumeText, requiredSkills);
            
        } catch (Exception e) {
            System.err.println("LLM Analysis failed: " + e.getMessage());
            // Fallback to basic analysis
            return performBasicAnalysis(resumeText, requiredSkills);
        }
    }

    private String buildAnalysisPrompt(String resumeText, String jobDescription, List<String> requiredSkills) {
        return String.format("""
            You are an expert HR analyst. Analyze the following resume against the job description and provide a skill match score.
            
            JOB DESCRIPTION:
            %s
            
            REQUIRED SKILLS:
            %s
            
            RESUME TEXT:
            %s
            
            Please provide your analysis in the following format:
            SCORE: [0-100]
            ANALYSIS: [Detailed analysis of skill matches, gaps, and overall fit]
            MATCHED_SKILLS: [List of skills from resume that match job requirements]
            MISSING_SKILLS: [List of required skills not found in resume]
            
            Be objective and consider:
            1. Technical skill matches
            2. Experience level alignment
            3. Domain knowledge relevance
            4. Overall candidate potential
            """, 
            jobDescription, 
            String.join(", ", requiredSkills), 
            resumeText.substring(0, Math.min(resumeText.length(), 3000)) // Limit resume text
        );
    }

    private SkillAnalysisResult parseAnalysisResult(String analysisText) {
        SkillAnalysisResult result = new SkillAnalysisResult();
        
        try {
            // Extract score
            if (analysisText.contains("SCORE:")) {
                String scoreLine = analysisText.substring(analysisText.indexOf("SCORE:") + 6);
                String scoreStr = scoreLine.split("\n")[0].trim();
                result.setScore(Integer.parseInt(scoreStr.replaceAll("[^0-9]", "")));
            }
            
            // Extract analysis
            if (analysisText.contains("ANALYSIS:")) {
                String analysisStart = analysisText.substring(analysisText.indexOf("ANALYSIS:") + 9);
                String analysis = analysisStart.split("MATCHED_SKILLS:")[0].trim();
                result.setAnalysis(analysis);
            }
            
            result.setFullAnalysis(analysisText);
            
        } catch (Exception e) {
            result.setScore(50); // Default score
            result.setAnalysis("Analysis parsing failed, using default score.");
            result.setFullAnalysis(analysisText);
        }
        
        return result;
    }

    private SkillAnalysisResult performBasicAnalysis(String resumeText, List<String> requiredSkills) {
        SkillAnalysisResult result = new SkillAnalysisResult();
        
        String lowerResumeText = resumeText.toLowerCase();
        int matchedSkills = 0;
        
        for (String skill : requiredSkills) {
            if (lowerResumeText.contains(skill.toLowerCase())) {
                matchedSkills++;
            }
        }
        
        int score = requiredSkills.isEmpty() ? 50 : (matchedSkills * 100) / requiredSkills.size();
        
        result.setScore(score);
        result.setAnalysis(String.format("Basic analysis: %d out of %d required skills found in resume.", 
                                       matchedSkills, requiredSkills.size()));
        result.setFullAnalysis("Fallback analysis used due to LLM service unavailability.");
        
        return result;
    }

    public static class SkillAnalysisResult {
        private int score;
        private String analysis;
        private String fullAnalysis;

        // Getters and setters
        public int getScore() { return score; }
        public void setScore(int score) { this.score = score; }
        
        public String getAnalysis() { return analysis; }
        public void setAnalysis(String analysis) { this.analysis = analysis; }
        
        public String getFullAnalysis() { return fullAnalysis; }
        public void setFullAnalysis(String fullAnalysis) { this.fullAnalysis = fullAnalysis; }
    }
}
