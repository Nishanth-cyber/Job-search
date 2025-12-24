package Springboot.controller;

import Springboot.model.CompanyModel;
import Springboot.model.UserModel;
import Springboot.repository.CompanyRepository;
import Springboot.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin/companies")
public class AdminCompanyController {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    public AdminCompanyController(CompanyRepository companyRepository, UserRepository userRepository) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }

    public static class CreateCompanyRequest {
        public String email;           // recruiter login
        public String password;        // temp password
        public String username;        // recruiter display name

        public String companyName;
        public String companyDescription;
        public String website;
        public String contactPhone;
        public String industry;
        public String size;
    }

    @PostMapping
    public ResponseEntity<?> createCompanyWithRecruiter(@RequestBody CreateCompanyRequest req) {
        if (req == null || req.email == null || req.email.isBlank() || req.password == null || req.password.isBlank() || req.companyName == null || req.companyName.isBlank()) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "email, password, and companyName are required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }
        if (userRepository.existsByEmail(req.email)) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "User already exists with this email");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(err);
        }

        // Create recruiter user
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        UserModel recruiter = new UserModel();
        recruiter.setEmail(req.email.trim());
        recruiter.setUsername(req.username != null && !req.username.isBlank() ? req.username : req.companyName);
        recruiter.setRole("RECRUITER");
        recruiter.setPassword(encoder.encode(req.password));
        recruiter.setCompanyName(req.companyName); // legacy fallback
        recruiter = userRepository.save(recruiter);

        // Create company
        CompanyModel company = new CompanyModel();
        company.setName(req.companyName);
        company.setDescription(req.companyDescription);
        company.setWebsite(req.website);
        company.setContactPhone(req.contactPhone);
        company.setIndustry(req.industry);
        company.setSize(req.size);
        company.setCreatedBy(recruiter.getId());
        company.setUpdatedAt(LocalDateTime.now());
        company = companyRepository.save(company);

        // Link user to company
        recruiter.setCompanyId(company.getId());
        recruiter = userRepository.save(recruiter);

        Map<String, Object> res = new HashMap<>();
        res.put("message", "Company and recruiter created");
        res.put("companyId", company.getId());
        res.put("recruiterId", recruiter.getId());
        res.put("recruiterEmail", recruiter.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }
}
