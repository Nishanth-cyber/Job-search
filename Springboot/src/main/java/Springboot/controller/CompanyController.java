package Springboot.controller;

import Springboot.model.UserModel;
import Springboot.model.CompanyModel;
import Springboot.repository.UserRepository;
import Springboot.repository.CompanyRepository;
import Springboot.service.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

@RestController
@RequestMapping("/companies")
@CrossOrigin(originPatterns = "${app.cors.allowed-origins:*}")
public class CompanyController {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final FileStorageService fileStorageService;

    public CompanyController(UserRepository userRepository, CompanyRepository companyRepository, FileStorageService fileStorageService) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.fileStorageService = fileStorageService;
    }

    // Public: fetch company logo by recruiter userId
    @GetMapping("/{userId}/logo")
    public ResponseEntity<?> getCompanyLogo(@PathVariable String userId) {
        Optional<UserModel> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        UserModel user = userOpt.get();
        if (user.getCompanyLogoFileId() == null) {
            return ResponseEntity.notFound().build();
        }
        try {
            Resource resource = fileStorageService.getFile(user.getCompanyLogoFileId());
            if (resource == null) return ResponseEntity.notFound().build();
            String filename = user.getCompanyLogoFileName() != null ? user.getCompanyLogoFileName() : "logo";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to load logo");
        }
    }

    // Public: fetch company logo by companyId
    @GetMapping("/by-id/{companyId}/logo")
    public ResponseEntity<?> getCompanyLogoById(@PathVariable String companyId) {
        Optional<CompanyModel> companyOpt = companyRepository.findById(companyId);
        if (companyOpt.isEmpty()) return ResponseEntity.notFound().build();
        CompanyModel c = companyOpt.get();
        if (c.getLogoFileId() == null) return ResponseEntity.notFound().build();
        try {
            Resource resource = fileStorageService.getFile(c.getLogoFileId());
            if (resource == null) return ResponseEntity.notFound().build();
            String filename = c.getLogoFileName() != null ? c.getLogoFileName() : "logo";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to load logo");
        }
    }

    // Recruiter: upload company logo by companyId
    @PostMapping("/{companyId}/logo")
    public ResponseEntity<?> uploadCompanyLogoById(@PathVariable String companyId, @RequestPart("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            UserModel me = requireCurrentUser();
            if (!"RECRUITER".equals(me.getRole())) {
                return ResponseEntity.status(403).body("Only recruiters can upload company logo");
            }
            if (me.getCompanyId() == null || !me.getCompanyId().equals(companyId)) {
                return ResponseEntity.status(403).body("You do not manage this company");
            }
            Optional<CompanyModel> companyOpt = companyRepository.findById(companyId);
            if (companyOpt.isEmpty()) return ResponseEntity.badRequest().body("Company not found");
            CompanyModel c = companyOpt.get();
            String fileId = fileStorageService.storeFile(file, me.getId());
            c.setLogoFileId(fileId);
            c.setLogoFileName(file.getOriginalFilename());
            companyRepository.save(c);
            return ResponseEntity.ok(c);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private UserModel requireCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth != null ? (String) auth.getPrincipal() : null;
        if (email == null) throw new RuntimeException("Unauthorized");
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }
}
