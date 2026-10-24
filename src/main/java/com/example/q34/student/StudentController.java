package com.example.q34.student;

import java.util.List;

import com.example.q34.api.ApiKeyGuard;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService service;
    private final ApiKeyGuard apiKeyGuard;

    public StudentController(StudentService service, ApiKeyGuard apiKeyGuard) {
        this.service = service;
        this.apiKeyGuard = apiKeyGuard;
    }

    @GetMapping
    public List<Student> getStudents() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Student getStudent(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Student createStudent(@Valid @RequestBody Student student,
                                 @RequestHeader(value = "X-Local-Admin-Key", required = false) String apiKey) {
        apiKeyGuard.requireConfiguredKey(apiKey);
        return service.create(student);
    }
}
