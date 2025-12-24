package Springboot.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Document("job_applications")
public class JobApplicationModel {
    @Id
    private String id;

    @NotBlank(message = "Job ID is required")
    private String jobId;

    @NotBlank(message = "Job seeker ID is required")
    private String jobSeekerId;

    private String resumeFileId; // GridFS file ID
    private String resumeFileName;
    
    private String coverLetter;

    private LocalDateTime appliedAt;

    
    // Resume test results
    private Integer testScore; // Score from 0-100 for 5-question test
    private boolean passedTest; // Whether testScore met threshold
    
    // N8N Analysis results
    private Integer n8nScore; // Score from N8N resume analysis
    private String n8nSuggestions; // Suggestions from N8N
    private boolean n8nAnalysisCompleted; // Whether N8N analysis is done

    // Detailed N8N output for UI display
    private String n8nSummary;
    private List<String> n8nKeyStrengths;
    private List<String> n8nMissingSkills;
    private List<String> n8nSuggestionsList;

    // Application Status
    private String status; // PENDING, UNDER_REVIEW, SHORTLISTED, REJECTED, HIRED

    // Additional fields for tracking
    private String jobTitle;
    private String companyName;
    private String jobSeekerName;
    private String jobSeekerEmail;

    public JobApplicationModel() {
        this.appliedAt = LocalDateTime.now();
        this.status = "PENDING";
        this.passedTest = false;
        this.n8nAnalysisCompleted = false;
    }
}
