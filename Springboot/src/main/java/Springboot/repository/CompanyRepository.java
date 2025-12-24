package Springboot.repository;

import Springboot.model.CompanyModel;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CompanyRepository extends MongoRepository<CompanyModel, String> {
}
