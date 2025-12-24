package Springboot.controller;

import Springboot.model.UserModel;
import Springboot.model.CompanyModel;
import Springboot.repository.UserRepository;
import Springboot.repository.CompanyRepository;
import Springboot.service.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Optional;

@RestController
@RequestMapping("/me")
@CrossOrigin(originPatterns = "${app.cors.allowed-origins:*}")
public class ProfileController {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final FileStorageService fileStorageService;

    public ProfileController(UserRepository userRepository, CompanyRepository companyRepository, FileStorageService fileStorageService) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.fileStorageService = fileStorageService;
    }

    @PostMapping("/company-logo")
    public ResponseEntity<?> uploadCompanyLogo(@RequestPart("file") MultipartFile logo) {
        try {
            UserModel me = requireCurrentUser();
            String role = me.getRole() != null ? me.getRole() : "";
            if (!"RECRUITER".equals(role) && !"COMPANY".equals(role) && !"ADMIN".equals(role)) {
                return ResponseEntity.status(403).body("Only recruiters/company can upload company logo");
            }
            String fileId = fileStorageService.storeFile(logo, me.getId());
            me.setCompanyLogoFileId(fileId);
            me.setCompanyLogoFileName(logo.getOriginalFilename());
            userRepository.save(me);
            me.setPassword(null);
            return ResponseEntity.ok(me);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getMe() {
        UserModel me = requireCurrentUser();
        me.setPassword(null);
        return ResponseEntity.ok(me);
    }

    // Recruiter: get own company profile (creates one if missing from legacy fields)
    @GetMapping("/company")
    public ResponseEntity<?> getMyCompany() {
        UserModel me = requireCurrentUser();
        if (!"RECRUITER".equals(me.getRole())) {
            return ResponseEntity.status(403).body("Only recruiters have a company profile");
        }
        CompanyModel company = resolveOrCreateCompanyForRecruiter(me);
        return ResponseEntity.ok(company);
    }

    // Recruiter: update own company profile
    @PutMapping("/company")
    public ResponseEntity<?> updateMyCompany(@RequestBody CompanyModel incoming) {
        UserModel me = requireCurrentUser();
        if (!"RECRUITER".equals(me.getRole())) {
            return ResponseEntity.status(403).body("Only recruiters can update company");
        }
        CompanyModel company = resolveOrCreateCompanyForRecruiter(me);
        if (incoming.getName() != null) company.setName(incoming.getName());
        company.setDescription(incoming.getDescription());
        company.setWebsite(incoming.getWebsite());
        company.setContactPhone(incoming.getContactPhone());
        company.setIndustry(incoming.getIndustry());
        company.setSize(incoming.getSize());
        company.setUpdatedAt(java.time.LocalDateTime.now());
        companyRepository.save(company);
        return ResponseEntity.ok(company);
    }

    @PutMapping
    public ResponseEntity<?> updateMe(@RequestBody UserModel incoming) {
        UserModel me = requireCurrentUser();
        // update allowed fields
        me.setFirstName(incoming.getFirstName());
        me.setLastName(incoming.getLastName());
        me.setPhone(incoming.getPhone());
        me.setProfileSummary(incoming.getProfileSummary());
        me.setSkills(incoming.getSkills());
        me.setExperience(incoming.getExperience());
        me.setEducation(incoming.getEducation());
        me.setLocation(incoming.getLocation());
        // recruiter/company fields (if role is RECRUITER/COMPANY/ADMIN)
        String role = me.getRole() != null ? me.getRole() : "";
        if ("RECRUITER".equals(role) || "COMPANY".equals(role) || "ADMIN".equals(role)) {
            me.setCompanyName(incoming.getCompanyName());
            me.setCompanyDescription(incoming.getCompanyDescription());
            me.setCompanyWebsite(incoming.getCompanyWebsite());
            me.setCompanySize(incoming.getCompanySize());
            me.setIndustry(incoming.getIndustry());
        }
        userRepository.save(me);
        me.setPassword(null);
        return ResponseEntity.ok(me);
    }

    @PostMapping("/resume")
    public ResponseEntity<?> uploadResume(@RequestPart("file") MultipartFile resume) {
        try {
            System.out.println("Resume upload endpoint called");
            System.out.println("File: " + resume.getOriginalFilename());
            System.out.println("Size: " + resume.getSize());
            
            UserModel me = requireCurrentUser();
            System.out.println("User ID: " + me.getId());
            
            String fileId = fileStorageService.storeFile(resume, me.getId());
            System.out.println("File ID returned: " + fileId);
            
            me.setResumeFileId(fileId);
            me.setResumeFileName(resume.getOriginalFilename());
            userRepository.save(me);
            me.setPassword(null);
            
            System.out.println("Resume uploaded successfully for user: " + me.getId());
            return ResponseEntity.ok(me);
        } catch (Exception e) {
            System.err.println("Error uploading resume: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/resume/{fileId}/download")
    public ResponseEntity<Resource> downloadResumeByFileId(@PathVariable String fileId) {
        try {
            System.out.println("N8N requesting resume download for fileId: " + fileId);
            
            Resource resource = fileStorageService.getFile(fileId);
            if (resource == null) {
                System.err.println("Resume file not found for fileId: " + fileId);
                return ResponseEntity.notFound().build();
            }
            
            String filename = fileStorageService.getFileName(fileId);
            if (filename == null) {
                filename = "resume.pdf";
            }
            
            System.out.println("Resume file found: " + filename);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            System.err.println("Error downloading resume: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/resume")
    public ResponseEntity<Resource> downloadResume() {
        try {
            UserModel me = requireCurrentUser();
            if (me.getResumeFileId() == null) {
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = fileStorageService.getFile(me.getResumeFileId());
            String filename = me.getResumeFileName() != null ? me.getResumeFileName() : "resume.pdf";
            
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth != null ? (String) auth.getPrincipal() : null;
        if (email == null) throw new RuntimeException("Unauthorized");
        Optional<UserModel> user = userRepository.findByEmail(email);
        if (user.isEmpty()) throw new RuntimeException("User not found");
        return user.get().getId();
    }

    private UserModel requireCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth != null ? (String) auth.getPrincipal() : null;
        if (email == null) throw new RuntimeException("Unauthorized");
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Create a company document for recruiter if missing (migrates legacy inline fields)
    private CompanyModel resolveOrCreateCompanyForRecruiter(UserModel me) {
        if (me.getCompanyId() != null) {
            return companyRepository.findById(me.getCompanyId()).orElseGet(() -> {
                CompanyModel c = new CompanyModel();
                c.setName(me.getCompanyName());
                c.setDescription(me.getCompanyDescription());
                c.setWebsite(me.getCompanyWebsite());
                c.setIndustry(me.getIndustry());
                c.setSize(me.getCompanySize());
                c.setCreatedBy(me.getId());
                CompanyModel saved = companyRepository.save(c);
                me.setCompanyId(saved.getId());
                userRepository.save(me);
                return saved;
            });
        }
        CompanyModel c = new CompanyModel();
        c.setName(me.getCompanyName());
        c.setDescription(me.getCompanyDescription());
        c.setWebsite(me.getCompanyWebsite());
        c.setIndustry(me.getIndustry());
        c.setSize(me.getCompanySize());
        c.setCreatedBy(me.getId());
        CompanyModel saved = companyRepository.save(c);
        me.setCompanyId(saved.getId());
        userRepository.save(me);
        return saved;
    }
}
