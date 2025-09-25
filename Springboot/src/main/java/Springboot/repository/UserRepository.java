package Springboot.repository;

import Springboot.model.UserModel;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserRepository extends MongoRepository<UserModel, String>
{
    Optional<UserModel> findByEmail(String email);
    boolean existsByEmail(String email);
}
