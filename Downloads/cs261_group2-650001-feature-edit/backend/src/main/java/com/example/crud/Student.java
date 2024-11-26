package com.example.crud;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.Type;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "students")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Student {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username", nullable = false, unique = true)
    private String username;

    @Column(name = "type")
    private String type = "student";

    @Column(name = "display_name_en")
    private String displayNameEn;

    @Column(name = "display_name_th")
    private String displayNameTh;

    @Column(name = "email")
    private String email;

    @Column(name = "department")
    private String department;

    @Column(name = "faculty")
    private String faculty;

    @Column(name = "tu_status")
    private String tuStatus;

    @Column(name = "status_id")
    private String statusId;

    @Column(name = "organization")
    private String organization;

    @Column(name = "status_work")
    private String statusWork;

    @Column(name = "status_emp")
    private String statusEmp;

    @Column(name = "created_at")
    private Long createdAt;

    @Column(name = "updated_at")
    private Long updatedAt;

    // Student Info as JSON string
    @Column(name = "student_info", columnDefinition = "TEXT")
    private String studentInfo;

    // Additional fields for academic information
    @Column(name = "advisor_name")
    private String advisorName;

    @Column(name = "gpax")
    private String gpax;

    @Column(name = "major")
    private String major;

    @Column(name = "phone")
    private String phone;

    @Column(name = "address")
    private String address;

    // Timestamps
    @PrePersist
    protected void onCreate() {
        this.createdAt = System.currentTimeMillis();
        this.updatedAt = System.currentTimeMillis();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = System.currentTimeMillis();
    }

    // Convenience method to update student info
    public void updateFromMap(java.util.Map<String, Object> updateData) {
        if (updateData.containsKey("username")) this.username = (String) updateData.get("username");
        if (updateData.containsKey("type")) this.type = (String) updateData.get("type");
        if (updateData.containsKey("displayname_en")) this.displayNameEn = (String) updateData.get("displayname_en");
        if (updateData.containsKey("displayname_th")) this.displayNameTh = (String) updateData.get("displayname_th");
        if (updateData.containsKey("email")) this.email = (String) updateData.get("email");
        if (updateData.containsKey("department")) this.department = (String) updateData.get("department");
        if (updateData.containsKey("faculty")) this.faculty = (String) updateData.get("faculty");
        if (updateData.containsKey("tu_status")) this.tuStatus = (String) updateData.get("tu_status");
        if (updateData.containsKey("status_id")) this.statusId = (String) updateData.get("status_id");
        if (updateData.containsKey("organization")) this.organization = (String) updateData.get("organization");
        if (updateData.containsKey("status_work")) this.statusWork = (String) updateData.get("status_work");
        if (updateData.containsKey("status_emp")) this.statusEmp = (String) updateData.get("status_emp");

        // Update academic info
        if (updateData.containsKey("advisor_name")) this.advisorName = (String) updateData.get("advisor_name");
        if (updateData.containsKey("gpax")) this.gpax = (String) updateData.get("gpax");
        if (updateData.containsKey("major")) this.major = (String) updateData.get("major");
        if (updateData.containsKey("phone")) this.phone = (String) updateData.get("phone");
        if (updateData.containsKey("address")) this.address = (String) updateData.get("address");
    }

    // Custom getter for student info that parses JSON
    public java.util.Map<String, Object> getStudentInfoAsMap() {
        if (this.studentInfo == null || this.studentInfo.isEmpty()) {
            return new java.util.HashMap<>();
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return mapper.readValue(this.studentInfo, java.util.Map.class);
        } catch (Exception e) {
            e.printStackTrace();
            return new java.util.HashMap<>();
        }
    }

    // Custom setter for student info that converts to JSON
    public void setStudentInfoFromMap(java.util.Map<String, Object> studentInfo) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            this.studentInfo = mapper.writeValueAsString(studentInfo);
        } catch (Exception e) {
            e.printStackTrace();
            this.studentInfo = "{}";
        }
    }

    // Method to merge student info
    public void updateStudentInfo(java.util.Map<String, Object> newInfo) {
        java.util.Map<String, Object> currentInfo = getStudentInfoAsMap();
        currentInfo.putAll(newInfo);
        setStudentInfoFromMap(currentInfo);
    }
}