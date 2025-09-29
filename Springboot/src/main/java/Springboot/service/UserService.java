package Springboot.service;

import Springboot.model.UserModel;
import Springboot.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public UserModel signup(UserModel user) throws Exception {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new Exception("Email already exists");
        }
        // Allow only JOBSEEKER or RECRUITER via signup. ADMIN cannot be assigned through signup.
        String role = user.getRole();
        if (role == null || role.isBlank()) {
            role = "JOBSEEKER";
        } else {
            role = role.trim().toUpperCase();
            if (!"JOBSEEKER".equals(role) && !"RECRUITER".equals(role)) {
                role = "JOBSEEKER";
            }
        }
        user.setRole(role);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public UserModel login(String email, String password) throws Exception {
        // Special fixed admin account
        if ("admin@gmail.com".equalsIgnoreCase(email) && "123456".equals(password)) {
            UserModel admin = userRepository.findByEmail(email).orElse(null);
            if (admin == null) {
                admin = new UserModel();
                admin.setEmail(email);
                admin.setUsername("Admin");
                admin.setRole("ADMIN");
                admin.setPassword(passwordEncoder.encode(password));
                admin = userRepository.save(admin);
            } else {
                // Ensure role is ADMIN
                if (admin.getRole() == null || !"ADMIN".equals(admin.getRole())) {
                    admin.setRole("ADMIN");
                    admin = userRepository.save(admin);
                }
            }
            return admin;
        }

        UserModel user = userRepository.findByEmail(email)
                .orElseThrow(() -> new Exception("User not found"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new Exception("Invalid password");
        }

        // Preserve existing non-admin roles; default to JOBSEEKER if missing
        if (user.getRole() == null) user.setRole("JOBSEEKER");
        return user;
    }
}