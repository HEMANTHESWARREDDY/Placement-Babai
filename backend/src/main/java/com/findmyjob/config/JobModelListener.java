package com.findmyjob.config;

import com.findmyjob.model.Job;
import com.findmyjob.service.SequenceGeneratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.mapping.event.AbstractMongoEventListener;
import org.springframework.data.mongodb.core.mapping.event.BeforeConvertEvent;
import org.springframework.stereotype.Component;

@Component
public class JobModelListener extends AbstractMongoEventListener<Job> {

    @Autowired
    private SequenceGeneratorService sequenceGenerator;

    @Override
    public void onBeforeConvert(BeforeConvertEvent<Job> event) {
        Job job = event.getSource();
        if (job.getId() == null || job.getId().trim().isEmpty()) {
            job.setId(String.valueOf(sequenceGenerator.generateSequence("jobs_sequence")));
        }
        if (job.getCreatedAt() == null) {
            job.setCreatedAt(java.time.LocalDateTime.now());
        }
    }
}
