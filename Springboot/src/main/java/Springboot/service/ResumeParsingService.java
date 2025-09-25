package Springboot.service;

import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

@Service
public class ResumeParsingService {

    private final Tika tika = new Tika();

    public String parseResume(MultipartFile file) throws IOException, TikaException {
        try (InputStream inputStream = file.getInputStream()) {
            return tika.parseToString(inputStream);
        }
    }

    public String parseResume(InputStream inputStream) throws IOException, TikaException {
        return tika.parseToString(inputStream);
    }

    public boolean isSupportedFileType(String contentType) {
        return contentType != null && (
            contentType.equals("application/pdf") ||
            contentType.equals("application/msword") ||
            contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
            contentType.equals("text/plain")
        );
    }

    public String extractSkillsAndExperience(String resumeText) {
        // Basic skill extraction logic - can be enhanced with NLP
        StringBuilder analysis = new StringBuilder();
        
        String lowerText = resumeText.toLowerCase();
        
        // Common programming languages
        String[] programmingSkills = {"java", "python", "javascript", "react", "spring", "node.js", 
                                    "angular", "vue", "c++", "c#", ".net", "php", "ruby", "go", "kotlin"};
        
        analysis.append("Technical Skills Found: ");
        for (String skill : programmingSkills) {
            if (lowerText.contains(skill)) {
                analysis.append(skill).append(", ");
            }
        }
        
        // Experience indicators
        if (lowerText.contains("years") || lowerText.contains("experience")) {
            analysis.append("\nExperience indicators found in resume.");
        }
        
        // Education indicators
        if (lowerText.contains("bachelor") || lowerText.contains("master") || 
            lowerText.contains("degree") || lowerText.contains("university")) {
            analysis.append("\nEducation background found.");
        }
        
        return analysis.toString();
    }
}
