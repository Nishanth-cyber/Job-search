package Springboot.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Document("users")
public class UserModel {
    @Id
    private String id;

    @NotBlank(message = "Username is required")
    private String username;

    @Email(message = "Email should be valid")
    @NotBlank(message = "Email is required")
    @Indexed(unique = true)
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    @NotBlank(message = "Role is required")
    private String role; // ADMIN, JOBSEEKER

    // Common fields
    private String firstName;
    private String lastName;
    private String phone;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // JobSeeker specific fields
    private String profileSummary;
    private List<String> skills;
    private String experience; // e.g., "2-3 years", "5+ years"
    private String education;
    private String location;
    private String resumeFileId; // GridFS file ID
    private String resumeFileName;

    // Admin/Company specific fields
    private String companyId; // reference to CompanyModel
    private String companyName;
    private String companyDescription;
    private String companyWebsite;
    private String companySize;
    private String industry;
    private String companyLogoFileId; // GridFS file ID for company logo
    private String companyLogoFileName;

    public UserModel() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}
