package com.example.q34.student;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StudentService {

    private final StudentRepository repository;

    public StudentService(StudentRepository repository) {
        this.repository = repository;
    }

    public List<Student> findAll() {
        return repository.findAll();
    }

    public Student findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
    }

    public Student create(Student student) {
        if (repository.existsByEmailIgnoreCase(student.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A student with this email already exists");
        }
        return repository.save(student);
    }
}
