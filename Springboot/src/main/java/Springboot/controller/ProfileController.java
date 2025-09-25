package Springboot.controller;

import Springboot.model.UserModel;
import Springboot.repository.UserRepository;
import Springboot.service.FileStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

@RestController
@RequestMapping("/me")
@CrossOrigin(origins = "http://localhost:5173")
public class ProfileController {

    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public ProfileController(UserRepository userRepository, FileStorageService fileStorageService) {
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping
    public ResponseEntity<?> getMe() {
        UserModel me = requireCurrentUser();
        me.setPassword(null);
        return ResponseEntity.ok(me);
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
        // admin/company fields (if role is ADMIN)
        if ("ADMIN".equals(me.getRole())) {
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
            UserModel me = requireCurrentUser();
            String fileId = fileStorageService.storeFile(resume, me.getId());
            me.setResumeFileId(fileId);
            me.setResumeFileName(resume.getOriginalFilename());
            userRepository.save(me);
            me.setPassword(null);
            return ResponseEntity.ok(me);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private UserModel requireCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth != null ? (String) auth.getPrincipal() : null;
        if (email == null) throw new RuntimeException("Unauthorized");
        Optional<UserModel> user = userRepository.findByEmail(email);
        if (user.isEmpty()) throw new RuntimeException("User not found");
        return user.get();
    }
}
