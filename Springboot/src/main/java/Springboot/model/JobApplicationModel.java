package Springboot.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

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
    private String resumeText; // Parsed resume text

    private String coverLetter;

    private LocalDateTime appliedAt;

    // AI Analysis Results
    private Integer skillScore; // Score from 0-100 based on LLM analysis
    private String skillAnalysis; // Detailed analysis from LLM
    private boolean passedInitialScreening; // Based on skill score threshold

    // Resume test results
    private Integer testScore; // Score from 0-100 for 5-question test
    private boolean passedTest; // Whether testScore met threshold

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
        this.passedInitialScreening = false;
        this.passedTest = false;
    }
}
