package com.findmyjob.config;

import com.findmyjob.model.FreeSession;
import org.springframework.data.mongodb.core.mapping.event.AbstractMongoEventListener;
import org.springframework.data.mongodb.core.mapping.event.BeforeConvertEvent;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;

@Component
public class FreeSessionModelListener extends AbstractMongoEventListener<FreeSession> {

    @Autowired
    private com.findmyjob.service.SequenceGeneratorService sequenceGenerator;

    @Override
    public void onBeforeConvert(BeforeConvertEvent<FreeSession> event) {
        FreeSession session = event.getSource();
        if (session.getId() == null || session.getId().trim().isEmpty()) {
            session.setId(String.valueOf(sequenceGenerator.generateSequence("sessions_sequence")));
        }
        if (session.getCreatedAt() == null) {
            session.setCreatedAt(java.time.LocalDateTime.now());
        }
    }
}
