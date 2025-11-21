package Springboot.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document("companies")
public class CompanyModel {
    @Id
    private String id;

    private String name;
    private String description;
    private String website;
    private String contactPhone;
    private String industry;
    private String size;

    private String logoFileId;
    private String logoFileName;

    private String createdBy; // recruiter user id
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public CompanyModel() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}
