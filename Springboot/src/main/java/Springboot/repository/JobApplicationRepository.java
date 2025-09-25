package Springboot.repository;

import Springboot.model.JobApplicationModel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface JobApplicationRepository extends MongoRepository<JobApplicationModel, String> {
    
    List<JobApplicationModel> findByJobSeekerId(String jobSeekerId);
    
    List<JobApplicationModel> findByJobId(String jobId);
    
    Optional<JobApplicationModel> findByJobIdAndJobSeekerId(String jobId, String jobSeekerId);
    
    @Query("{'status': ?0}")
    List<JobApplicationModel> findByStatus(String status);
    
    @Query("{'jobId': ?0, 'passedInitialScreening': true}")
    List<JobApplicationModel> findByJobIdAndPassedInitialScreeningTrue(String jobId);
    
    @Query("{'jobId': ?0, 'skillScore': {$gte: ?1}}")
    List<JobApplicationModel> findByJobIdAndSkillScoreGreaterThanEqual(String jobId, Integer minScore);
    
    long countByJobId(String jobId);
    
    long countByJobIdAndPassedInitialScreeningTrue(String jobId);
}
