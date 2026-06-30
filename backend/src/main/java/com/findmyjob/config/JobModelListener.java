package com.findmyjob.config;

import com.findmyjob.model.Job;
import com.findmyjob.service.SequenceGeneratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.mapping.event.AbstractMongoEventListener;
import org.springframework.data.mongodb.core.mapping.event.BeforeConvertEvent;
import org.springframework.stereotype.Component;

@Component
public class JobModelListener extends AbstractMongoEventListener<Job> {

    private final SequenceGeneratorService sequenceGenerator;

    @Autowired
    public JobModelListener(SequenceGeneratorService sequenceGenerator) {
        this.sequenceGenerator = sequenceGenerator;
    }

    @Override
    public void onBeforeConvert(BeforeConvertEvent<Job> event) {
        Job job = event.getSource();
        if (job.getId() == null || job.getId().trim().isEmpty()) {
            job.setId(String.valueOf(sequenceGenerator.generateSequence("jobs_sequence")));
            sequenceGenerator.incrementLifetimeCount("lifetime_jobs_created", 0);
        }
        if (job.getCreatedAt() == null) {
            job.setCreatedAt(java.time.LocalDateTime.now());
        }
    }
}
