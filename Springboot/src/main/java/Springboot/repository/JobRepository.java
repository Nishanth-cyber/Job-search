package Springboot.repository;

import Springboot.model.JobModel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface JobRepository extends MongoRepository<JobModel, String> {
    
    List<JobModel> findByIsActiveTrue();
    
    List<JobModel> findByPostedBy(String postedBy);
    
    @Query("{'title': {$regex: ?0, $options: 'i'}}")
    List<JobModel> findByTitleContainingIgnoreCase(String title);
    
    @Query("{'location': {$regex: ?0, $options: 'i'}}")
    List<JobModel> findByLocationContainingIgnoreCase(String location);
    
    @Query("{'requiredSkills': {$in: ?0}}")
    List<JobModel> findByRequiredSkillsIn(List<String> skills);
    
    @Query("{'jobType': ?0, 'isActive': true}")
    List<JobModel> findByJobTypeAndIsActiveTrue(String jobType);
    
    @Query("{'experienceLevel': ?0, 'isActive': true}")
    List<JobModel> findByExperienceLevelAndIsActiveTrue(String experienceLevel);
    
    @Query("{'companyName': {$regex: ?0, $options: 'i'}, 'isActive': true}")
    List<JobModel> findByCompanyNameContainingIgnoreCaseAndIsActiveTrue(String companyName);
}
