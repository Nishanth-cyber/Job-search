package Springboot.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@Document("jobs")
public class JobModel {
    @Id
    private String id;

    @NotBlank(message = "Job title is required")
    private String title;

    @NotBlank(message = "Job description is required")
    private String description;

    @NotBlank(message = "Company name is required")
    private String companyName;
    private String companyId; // reference to CompanyModel

    @NotBlank(message = "Location is required")
    private String location;

    @NotBlank(message = "Job type is required")
    private String jobType; // FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP

    @NotBlank(message = "Experience level is required")
    private String experienceLevel; // ENTRY, MID, SENIOR, EXECUTIVE

    @NotNull(message = "Salary range is required")
    @Min(value = 0, message = "Minimum salary must be positive")
    private Double salaryMin;

    @NotNull(message = "Salary range is required")
    @Min(value = 0, message = "Maximum salary must be positive")
    private Double salaryMax;

    private String salaryCurrency; // USD, INR, etc.

    @NotNull(message = "Required skills are required")
    private List<String> requiredSkills;

    private List<String> preferredSkills;

    @NotBlank(message = "Requirements are required")
    private String requirements;

    private String benefits;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private String postedBy; // Admin user ID - set by backend from authenticated user

    private LocalDateTime postedAt;
    private LocalDateTime updatedAt;
    private LocalDateTime applicationDeadline;

    
    private boolean isActive;
    private int applicationCount;

    // Company specific features
    private String companyLogo;
    private String companyWebsite;
    private String companyDescription;
    private String companySize;
    private String industry;

    // Minimum N8N score required to allow skill test
    private Integer minN8nScoreForTest;

    public JobModel() {
        this.postedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.isActive = true;
        this.applicationCount = 0;
        this.salaryCurrency = "USD";
    }
}
