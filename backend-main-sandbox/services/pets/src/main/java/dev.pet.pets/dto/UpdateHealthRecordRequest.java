package dev.pet.pets.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class UpdateHealthRecordRequest {

    private Long activityTypeId;

    @Size(max = 100)
    private List<Long> symptomIds;

    @Size(max = 2000)
    @JsonAlias("comments")
    private String notes;

    @Size(max = 255)
    private String conditionName;

    @Size(max = 32)
    private String conditionStatus;

    private Double weightKg;

    private Double activityHours;

    private LocalDate recordDate;

    public Long getActivityTypeId() { return activityTypeId; }
    public void setActivityTypeId(Long activityTypeId) { this.activityTypeId = activityTypeId; }

    public List<Long> getSymptomIds() { return symptomIds; }
    public void setSymptomIds(List<Long> symptomIds) { this.symptomIds = symptomIds; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getConditionName() { return conditionName; }
    public void setConditionName(String conditionName) { this.conditionName = conditionName; }

    public String getConditionStatus() { return conditionStatus; }
    public void setConditionStatus(String conditionStatus) { this.conditionStatus = conditionStatus; }

    public Double getWeightKg() { return weightKg; }
    public void setWeightKg(Double weightKg) { this.weightKg = weightKg; }

    public Double getActivityHours() { return activityHours; }
    public void setActivityHours(Double activityHours) { this.activityHours = activityHours; }

    public LocalDate getRecordDate() { return recordDate; }
    public void setRecordDate(LocalDate recordDate) { this.recordDate = recordDate; }
}
