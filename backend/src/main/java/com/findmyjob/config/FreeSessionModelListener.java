package com.findmyjob.config;

import com.findmyjob.model.FreeSession;
import org.springframework.data.mongodb.core.mapping.event.AbstractMongoEventListener;
import org.springframework.data.mongodb.core.mapping.event.BeforeConvertEvent;
import org.springframework.stereotype.Component;

@Component
public class FreeSessionModelListener extends AbstractMongoEventListener<FreeSession> {

    @Override
    public void onBeforeConvert(BeforeConvertEvent<FreeSession> event) {
        FreeSession session = event.getSource();
        if (session.getCreatedAt() == null) {
            session.setCreatedAt(java.time.LocalDateTime.now());
        }
    }
}
