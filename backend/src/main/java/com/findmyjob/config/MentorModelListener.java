package com.findmyjob.config;

import com.findmyjob.model.Mentor;
import com.findmyjob.service.SequenceGeneratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.mapping.event.AbstractMongoEventListener;
import org.springframework.data.mongodb.core.mapping.event.BeforeConvertEvent;
import org.springframework.stereotype.Component;

@Component
public class MentorModelListener extends AbstractMongoEventListener<Mentor> {

    @Autowired
    private SequenceGeneratorService sequenceGenerator;

    @Override
    public void onBeforeConvert(BeforeConvertEvent<Mentor> event) {
        Mentor mentor = event.getSource();
        if (mentor.getId() == null || mentor.getId().trim().isEmpty()) {
            sequenceGenerator.incrementLifetimeCount("lifetime_mentors_approved", 0);
        }
    }
}
