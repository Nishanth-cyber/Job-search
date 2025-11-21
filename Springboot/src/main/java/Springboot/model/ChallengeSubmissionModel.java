package Springboot.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document("challenge_submissions")
public class ChallengeSubmissionModel {
    @Id
    private String id;

    private String challengeId;
    private String userId;
    private String submitterEmail;
    private String submitterName;

    private String content; 

    private LocalDateTime createdAt = LocalDateTime.now();
}
