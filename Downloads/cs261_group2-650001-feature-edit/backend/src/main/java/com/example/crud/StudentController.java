package com.example.crud;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*")
public class StudentController {

    @Autowired
    private StudentRepository studentRepository;

    @PostMapping("/add")
    public ResponseEntity<?> createStudent(@RequestBody Map<String, Object> tuData) {
        try {
            System.out.println("Received create student request with data: " + tuData);

            // Create new student from the TU API response data
            Student student = new Student();
            student.setUsername(getString(tuData, "username"));
            student.setType(getString(tuData, "type", "student"));
            student.setDisplayNameEn(getString(tuData, "displayname_en"));
            student.setDisplayNameTh(getString(tuData, "displayname_th"));
            student.setEmail(getString(tuData, "email"));
            student.setDepartment(getString(tuData, "department"));
            student.setFaculty(getString(tuData, "faculty"));
            student.setTuStatus(getString(tuData, "tu_status"));
            student.setStatusId(getString(tuData, "statusid"));
            student.setOrganization(getString(tuData, "organization"));
            student.setStatusWork(getString(tuData, "StatusWork"));
            student.setStatusEmp(getString(tuData, "StatusEmp"));

            // Check if student info exists
            @SuppressWarnings("unchecked")
            Map<String, Object> studentInfo = (Map<String, Object>) tuData.get("student_info");
            if (studentInfo != null) {
                student.setStudentInfoFromMap(studentInfo);
            }

            // Save the student
            Student savedStudent = studentRepository.save(student);

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Student created successfully");
            response.put("data", savedStudent);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            System.err.println("Error creating student: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", "Error creating student: " + e.getMessage());

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(response);
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllStudents() {
        try {
            List<Student> students = studentRepository.findAll();

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("data", students);
            response.put("count", students.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", "Error fetching students: " + e.getMessage());

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(response);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getStudentById(@PathVariable Long id) {
        try {
            return studentRepository.findById(id)
                    .map(student -> {
                        Map<String, Object> response = new HashMap<>();
                        response.put("status", "success");
                        response.put("data", student);
                        return ResponseEntity.ok(response);
                    })
                    .orElseGet(() -> {
                        Map<String, Object> response = new HashMap<>();
                        response.put("status", "error");
                        response.put("message", "Student not found with id: " + id);
                        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
                    });
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", "Error fetching student: " + e.getMessage());

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(response);
        }
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<?> getStudentByUsername(@PathVariable String username) {
        try {
            return studentRepository.findByUsername(username)
                    .map(student -> {
                        Map<String, Object> response = new HashMap<>();
                        response.put("status", "success");
                        response.put("data", student);
                        return ResponseEntity.ok(response);
                    })
                    .orElseGet(() -> {
                        Map<String, Object> response = new HashMap<>();
                        response.put("status", "error");
                        response.put("message", "Student not found with username: " + username);
                        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
                    });
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", "Error fetching student: " + e.getMessage());

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(response);
        }
    }

    @PutMapping("/{username}")
    public ResponseEntity<?> updateStudent(@PathVariable String username, @RequestBody Map<String, Object> updateData) {
        try {
            System.out.println("Updating student: " + username + " with data: " + updateData);

            return studentRepository.findByUsername(username)
                    .map(student -> {
                        // Update basic info
                        if (updateData.containsKey("type")) student.setType(getString(updateData, "type"));
                        if (updateData.containsKey("displayname_en")) student.setDisplayNameEn(getString(updateData, "displayname_en"));
                        if (updateData.containsKey("displayname_th")) student.setDisplayNameTh(getString(updateData, "displayname_th"));
                        if (updateData.containsKey("email")) student.setEmail(getString(updateData, "email"));
                        if (updateData.containsKey("department")) student.setDepartment(getString(updateData, "department"));
                        if (updateData.containsKey("faculty")) student.setFaculty(getString(updateData, "faculty"));
                        if (updateData.containsKey("tu_status")) student.setTuStatus(getString(updateData, "tu_status"));
                        if (updateData.containsKey("statusid")) student.setStatusId(getString(updateData, "statusid"));
                        if (updateData.containsKey("organization")) student.setOrganization(getString(updateData, "organization"));
                        if (updateData.containsKey("StatusWork")) student.setStatusWork(getString(updateData, "StatusWork"));
                        if (updateData.containsKey("StatusEmp")) student.setStatusEmp(getString(updateData, "StatusEmp"));

                        // Update student info if provided
                        @SuppressWarnings("unchecked")
                        Map<String, Object> studentInfo = (Map<String, Object>) updateData.get("student_info");
                        if (studentInfo != null) {
                            student.updateStudentInfo(studentInfo);
                        }

                        // Save updated student
                        Student updatedStudent = studentRepository.save(student);

                        Map<String, Object> response = new HashMap<>();
                        response.put("status", "success");
                        response.put("message", "Student updated successfully");
                        response.put("data", updatedStudent);

                        return ResponseEntity.ok(response);
                    })
                    .orElseGet(() -> {
                        Map<String, Object> response = new HashMap<>();
                        response.put("status", "error");
                        response.put("message", "Student not found with username: " + username);
                        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
                    });

        } catch (Exception e) {
            System.err.println("Error updating student: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", "Error updating student: " + e.getMessage());

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStudent(@PathVariable Long id) {
        try {
            if (studentRepository.existsById(id)) {
                studentRepository.deleteById(id);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Student deleted successfully");

                return ResponseEntity.ok(response);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", "Student not found with id: " + id);

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", "Error deleting student: " + e.getMessage());

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(response);
        }
    }

    // Helper methods
    private String getString(Map<String, Object> map, String key) {
        return getString(map, key, null);
    }

    private String getString(Map<String, Object> map, String key, String defaultValue) {
        Object value = map.get(key);
        return value != null ? value.toString() : defaultValue;
    }
}