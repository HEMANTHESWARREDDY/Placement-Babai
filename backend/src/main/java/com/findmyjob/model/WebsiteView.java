package com.findmyjob.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "website_views")
public class WebsiteView {
    @Id
    private String id;

    private LocalDateTime viewedAt;

    public WebsiteView() {
    }

    public WebsiteView(LocalDateTime viewedAt) {
        this.viewedAt = viewedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public LocalDateTime getViewedAt() {
        return viewedAt;
    }

    public void setViewedAt(LocalDateTime viewedAt) {
        this.viewedAt = viewedAt;
    }
}
