package Springboot.repository;

import Springboot.model.ChallengeSubmissionModel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChallengeSubmissionRepository extends MongoRepository<ChallengeSubmissionModel, String> {
    List<ChallengeSubmissionModel> findByChallengeIdOrderByCreatedAtDesc(String challengeId);
    List<ChallengeSubmissionModel> findByUserIdOrderByCreatedAtDesc(String userId);
}
