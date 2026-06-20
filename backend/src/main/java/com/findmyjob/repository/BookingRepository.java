package com.findmyjob.repository;

import com.findmyjob.model.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findByMentorId(String mentorId);
    long countByMentorId(String mentorId);
}
