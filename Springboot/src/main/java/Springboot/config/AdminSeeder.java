package Springboot.config;

import Springboot.model.UserModel;
import Springboot.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Component
public class AdminSeeder implements ApplicationRunner {

    private final UserRepository userRepository;

    public AdminSeeder(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Value("${admin.seed.enabled:false}")
    private boolean seedEnabled;

    @Value("${admin.seed.email:}")
    private String adminEmail;

    @Value("${admin.seed.password:}")
    private String adminPassword;

    @Value("${admin.seed.username:Admin}")
    private String adminUsername;

    @Value("${admin.seed.companyName:}")
    private String companyName;

    @Value("${admin.seed.companyDescription:}")
    private String companyDescription;

    @Value("${admin.seed.companyWebsite:}")
    private String companyWebsite;

    @Value("${admin.seed.companySize:}")
    private String companySize;

    @Value("${admin.seed.industry:}")
    private String industry;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (!seedEnabled) return;
        if (adminEmail == null || adminEmail.isBlank() || adminPassword == null || adminPassword.isBlank()) {
            return; 
        }

        UserModel admin = userRepository.findByEmail(adminEmail).orElse(null);
        if (admin == null) {
            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
            admin = new UserModel();
            admin.setEmail(adminEmail);
            admin.setUsername(adminUsername);
            admin.setRole("ADMIN");
            admin.setPassword(encoder.encode(adminPassword));
            admin.setCompanyName(companyName);
            admin.setCompanyDescription(companyDescription);
            admin.setCompanyWebsite(companyWebsite);
            admin.setCompanySize(companySize);
            admin.setIndustry(industry);
            userRepository.save(admin);
        } else {
            boolean changed = false;
            if (admin.getRole() == null || !"ADMIN".equals(admin.getRole())) {
                admin.setRole("ADMIN");
                changed = true;
            }
            if (admin.getUsername() == null || admin.getUsername().isBlank()) {
                admin.setUsername(adminUsername);
                changed = true;
            }
            // Do not overwrite existing password or company details if already present
            if (changed) {
                userRepository.save(admin);
            }
        }
    }
}
