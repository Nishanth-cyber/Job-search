package Springboot.controller;

import Springboot.model.UserModel;
import Springboot.service.UserService;
import Springboot.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseCookie;
import org.springframework.http.HttpHeaders;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/auth")
@CrossOrigin(originPatterns = "${app.cors.allowed-origins:http://localhost:5173}") // configurable origins
public class UserController {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    public UserController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody UserModel user) {
        try {
            UserModel savedUser = userService.signup(user);
            savedUser.setPassword(null); // hide password in response
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserModel user, HttpServletResponse servletResponse) {
        try {
            UserModel loggedUser = userService.login(user.getEmail(), user.getPassword());
            loggedUser.setPassword(null);

            String token = jwtUtil.generateToken(loggedUser.getEmail());
            // Set JWT as HttpOnly cookie. Note: for local http dev, Secure must be false; in production use Secure=true and SameSite=None
            ResponseCookie cookie = ResponseCookie.from("jwt", token)
                    .httpOnly(true)
                    .secure(false) // TODO: set true in production (https)
                    .sameSite("Lax") // For cross-site dev, prefer proxy; in prod across subdomains use None
                    .path("/")
                    .maxAge(60L * 60L * 24L * 7L) // 7 days
                    .build();

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(new AuthResponse(loggedUser, token));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        ResponseCookie cleared = ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cleared.toString())
                .body("logged out");
    }

    public static class AuthResponse {
        public UserModel user;
        public String token;
        public AuthResponse(UserModel user, String token) {
            this.user = user;
            this.token = token;
        }
    }

    public static class ChangePasswordRequest {
        public String currentPassword;
        public String newPassword;
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest req) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth != null ? (String) auth.getPrincipal() : null;
            if (email == null) return ResponseEntity.status(401).body("Unauthorized");
            userService.changePassword(email, req.currentPassword, req.newPassword);
            return ResponseEntity.ok("Password changed");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

}