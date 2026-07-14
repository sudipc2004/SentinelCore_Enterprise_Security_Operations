package com.sentinelcore.config;

import com.sentinelcore.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/register", "/api/auth/login").permitAll()
                
                // User CRUD authorization rules
                .requestMatchers(HttpMethod.GET, "/api/users/**").hasAnyRole("ADMIN", "ANALYST", "VIEWER")
                .requestMatchers(HttpMethod.POST, "/api/users/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/users/**").hasAnyRole("ADMIN", "ANALYST")
                .requestMatchers(HttpMethod.DELETE, "/api/users/**").hasRole("ADMIN")

                // Team CRUD authorization rules
                .requestMatchers(HttpMethod.GET, "/api/teams/**").hasAnyRole("ADMIN", "ANALYST", "VIEWER")
                .requestMatchers(HttpMethod.POST, "/api/teams/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/teams/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/teams/**").hasRole("ADMIN")

                // Incident Management authorization rules
                .requestMatchers(HttpMethod.GET, "/api/incidents/**").hasAnyRole("ADMIN", "ANALYST", "VIEWER")
                .requestMatchers(HttpMethod.POST, "/api/incidents/**").hasAnyRole("ADMIN", "ANALYST")
                .requestMatchers(HttpMethod.PUT, "/api/incidents/**").hasAnyRole("ADMIN", "ANALYST")
                .requestMatchers(HttpMethod.DELETE, "/api/incidents/**").hasRole("ADMIN")

                // Asset Inventory authorization rules
                .requestMatchers(HttpMethod.GET, "/api/assets/**").hasAnyRole("ADMIN", "ANALYST", "VIEWER")
                .requestMatchers(HttpMethod.POST, "/api/assets/**").hasAnyRole("ADMIN", "ANALYST")
                .requestMatchers(HttpMethod.DELETE, "/api/assets/**").hasRole("ADMIN")

                // Threat Intelligence authorization rules
                .requestMatchers(HttpMethod.GET, "/api/threat-intel/**").hasAnyRole("ADMIN", "ANALYST", "VIEWER")
                .requestMatchers(HttpMethod.POST, "/api/threat-intel/**").hasAnyRole("ADMIN", "ANALYST")
                .requestMatchers(HttpMethod.DELETE, "/api/threat-intel/**").hasRole("ADMIN")

                // Log Management authorization rules
                .requestMatchers(HttpMethod.GET, "/api/logs/**").hasAnyRole("ADMIN", "ANALYST", "VIEWER")
                .requestMatchers(HttpMethod.POST, "/api/logs/**").hasAnyRole("ADMIN", "ANALYST")
                .requestMatchers(HttpMethod.DELETE, "/api/logs/**").hasRole("ADMIN")

                // Audit Logs authorization rules
                .requestMatchers("/api/audit-logs/**").hasAnyRole("ADMIN", "ANALYST")

                // Dashboard stats
                .requestMatchers("/api/dashboard/**").hasAnyRole("ADMIN", "ANALYST", "VIEWER")
                
                // Allow profile and logout
                .requestMatchers("/api/auth/profile", "/api/auth/logout").authenticated()

                .anyRequest().authenticated()
            );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Collections.singletonList("http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
        configuration.setExposedHeaders(Collections.singletonList("Authorization"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
