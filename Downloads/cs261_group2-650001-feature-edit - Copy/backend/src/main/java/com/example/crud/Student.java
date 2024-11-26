package com.example.crud;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "students")
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

    // ข้อมูลเพิ่มเติมของนักศึกษา
    @Column(name = "phone")
    private String phone;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "advisor_name")
    private String advisorName;

    @Column(name = "gpax")
    private String gpax;

    // ข้อมูลเวลา
    @Column(name = "created_at")
    private Long createdAt;

    @Column(name = "updated_at")
    private Long updatedAt;

    // Methods for handling timestamps
    @PrePersist
    protected void onCreate() {
        this.createdAt = System.currentTimeMillis();
        this.updatedAt = System.currentTimeMillis();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = System.currentTimeMillis();
    }

    // Utility method to update from a map of values
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

        // ข้อมูลเพิ่มเติม
        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> studentInfo = (java.util.Map<String, Object>) updateData.get("student_info");
        if (studentInfo != null) {
            if (studentInfo.containsKey("phone")) this.phone = (String) studentInfo.get("phone");
            if (studentInfo.containsKey("address")) this.address = (String) studentInfo.get("address");
            if (studentInfo.containsKey("advisorName")) this.advisorName = (String) studentInfo.get("advisorName");
            if (studentInfo.containsKey("gpax")) this.gpax = (String) studentInfo.get("gpax");
        }
    }

    // Convert to response map
    public java.util.Map<String, Object> toResponseMap() {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("id", this.id);
        response.put("username", this.username);
        response.put("type", this.type);
        response.put("displayNameEn", this.displayNameEn);
        response.put("displayNameTh", this.displayNameTh);
        response.put("email", this.email);
        response.put("department", this.department);
        response.put("faculty", this.faculty);
        response.put("tuStatus", this.tuStatus);
        response.put("statusId", this.statusId);
        response.put("organization", this.organization);
        response.put("statusWork", this.statusWork);
        response.put("statusEmp", this.statusEmp);

        // ข้อมูลเพิ่มเติม
        java.util.Map<String, Object> studentInfo = new java.util.HashMap<>();
        studentInfo.put("phone", this.phone);
        studentInfo.put("address", this.address);
        studentInfo.put("advisorName", this.advisorName);
        studentInfo.put("gpax", this.gpax);
        response.put("studentInfo", studentInfo);

        response.put("createdAt", this.createdAt);
        response.put("updatedAt", this.updatedAt);

        return response;
    }

    // Default values for optional fields
    public void setDefaultValues() {
        if (this.type == null) this.type = "student";
        if (this.createdAt == null) this.createdAt = System.currentTimeMillis();
        if (this.updatedAt == null) this.updatedAt = System.currentTimeMillis();
    }
}