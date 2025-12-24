package Springboot.repository;

import Springboot.model.ChallengeModel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChallengeRepository extends MongoRepository<ChallengeModel, String> {
    List<ChallengeModel> findByActiveTrueOrderByCreatedAtDesc();
    List<ChallengeModel> findByActiveTrueAndTitleRegexIgnoreCaseOrderByCreatedAtDesc(String titleRegex);
}
