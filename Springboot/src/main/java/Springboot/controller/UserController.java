package Springboot.controller;

import Springboot.model.UserModel;
import Springboot.service.UserService;
import Springboot.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:5173") // React dev server
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
    public ResponseEntity<?> login(@RequestBody UserModel user) {
        try {
            UserModel loggedUser = userService.login(user.getEmail(), user.getPassword());
            loggedUser.setPassword(null);

            String token = jwtUtil.generateToken(loggedUser.getEmail());
            return ResponseEntity.ok(new AuthResponse(loggedUser, token));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    public static class AuthResponse {
        public UserModel user;
        public String token;
        public AuthResponse(UserModel user, String token) {
            this.user = user;
            this.token = token;
        }
    }

}