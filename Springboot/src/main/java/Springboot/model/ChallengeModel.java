package Springboot.model;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Document("challenges")
public class ChallengeModel {
    @Id
    private String id;

    @NotBlank
    private String title;

    @NotBlank
    private String companyName;

    private String difficulty; 

    private List<String> skills;

    @NotBlank
    private String description;

    private String summary;

    private String createdByUserId;

    private Boolean active = true;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
}
