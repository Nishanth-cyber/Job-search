package Springboot.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import Springboot.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
// removed custom AuthorizationDecision helper

@Configuration
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> {})
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Always allow preflight
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/auth/**").permitAll()
                        // Public reads for jobs
                        .requestMatchers(HttpMethod.GET, "/jobs", "/jobs/search", "/jobs/*", "/jobs/**").permitAll()
                        // Public reads for challenges
                        .requestMatchers(HttpMethod.GET, "/challenges", "/challenges/*", "/challenges/**").permitAll()
                        // Allow jobseekers to submit answers for evaluation
                        .requestMatchers(HttpMethod.POST, "/jobs/*/evaluate-answers").hasRole("JOBSEEKER")
                        // Job writes: only RECRUITER role
                        .requestMatchers(HttpMethod.POST, "/jobs", "/jobs/**").hasRole("RECRUITER")
                        .requestMatchers(HttpMethod.PUT, "/jobs/**").hasRole("RECRUITER")
                        .requestMatchers(HttpMethod.PATCH, "/jobs/**").hasRole("RECRUITER")
                        .requestMatchers(HttpMethod.DELETE, "/jobs/**").hasRole("RECRUITER")
                        // Challenges: only RECRUITER can post; jobseekers can submit solutions
                        .requestMatchers(HttpMethod.POST, "/challenges").hasRole("RECRUITER")
                        .requestMatchers(HttpMethod.GET, "/challenges/*/submissions").hasRole("RECRUITER")
                        // Admin-only dashboard endpoints
                        .requestMatchers("/admin/dashboard/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/challenges/*/submit").hasRole("JOBSEEKER")
                        .requestMatchers("/applications/me").hasRole("JOBSEEKER")
                        .requestMatchers("/applications/**").authenticated()
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(unauthorizedEntryPoint())
                        .accessDeniedHandler(accessDeniedHandler())
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    // no custom helpers

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**") // allow all endpoints
                        .allowedOrigins("http://localhost:5173") // frontend
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }

    // Provide explicit CORS configuration for Spring Security to use
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET","POST","PUT","DELETE","PATCH","OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public AuthenticationEntryPoint unauthorizedEntryPoint() {
        return (HttpServletRequest request, HttpServletResponse response, org.springframework.security.core.AuthenticationException authException) -> {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType("application/json");
            try {
                response.getWriter().write("{\"error\":\"Unauthorized: Invalid or expired token\"}");
            } catch (IOException ignored) {}
        };
    }

    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (HttpServletRequest request, HttpServletResponse response, org.springframework.security.access.AccessDeniedException accessDeniedException) -> {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType("application/json");
            try {
                response.getWriter().write("{\"error\":\"Forbidden: Insufficient permissions\"}");
            } catch (IOException ignored) {}
        };
    }
}
