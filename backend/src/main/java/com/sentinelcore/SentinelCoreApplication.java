package com.sentinelcore;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SentinelCoreApplication {
    public static void main(String[] args) {
        SpringApplication.run(SentinelCoreApplication.class, args);
    }
}
