package com.findmyjob.config;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Production MongoDB configuration.
 * Builds the connection URI programmatically so that special characters
 * in MONGODB_USER / MONGODB_PASSWORD (e.g. '@', ':') are URL-encoded
 * automatically — the user just sets plain-text values in Render env vars.
 *
 * Providing a MongoClientSettings bean causes Spring Boot's
 * MongoClientSettingsConfiguration (which reads spring.data.mongodb.uri)
 * to back off completely, avoiding the "invalid user information" error.
 */
@Configuration
@Profile("prod")
public class MongoConfig {

    @Value("${MONGODB_USER:hemanth14082004_db_user}")
    private String mongoUser;

    @Value("${MONGODB_PASSWORD:aeC3JKZwThXd6U}")
    private String mongoPassword;

    @Bean
    public MongoClientSettings mongoClientSettings() {
        String encodedUser     = URLEncoder.encode(mongoUser,     StandardCharsets.UTF_8);
        String encodedPassword = URLEncoder.encode(mongoPassword, StandardCharsets.UTF_8);

        String uri = String.format(
            "mongodb+srv://%s:%s@pb-cluster1.177bqoy.mongodb.net/findmyjob" +
            "?retryWrites=true&w=majority&appName=PB-Cluster1",
            encodedUser, encodedPassword
        );

        System.out.println("🔗 [MongoConfig] Connecting to MongoDB Atlas as user: " + mongoUser);

        return MongoClientSettings.builder()
                .applyConnectionString(new ConnectionString(uri))
                .build();
    }
}
