package dev.pet.pets.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

public class PetOwnerRecordRequest {
    @NotBlank @Size(max = 200) private String topic;
    @NotNull private LocalDate recordDate;
    @NotNull private LocalTime recordTime;
    @NotBlank @Size(max = 10000) private String message;
    private boolean useEmail;
    private boolean useSms;
    private boolean useTelegram;

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }
    public LocalDate getRecordDate() { return recordDate; }
    public void setRecordDate(LocalDate recordDate) { this.recordDate = recordDate; }
    public LocalTime getRecordTime() { return recordTime; }
    public void setRecordTime(LocalTime recordTime) { this.recordTime = recordTime; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public boolean isUseEmail() { return useEmail; }
    public void setUseEmail(boolean useEmail) { this.useEmail = useEmail; }
    public boolean isUseSms() { return useSms; }
    public void setUseSms(boolean useSms) { this.useSms = useSms; }
    public boolean isUseTelegram() { return useTelegram; }
    public void setUseTelegram(boolean useTelegram) { this.useTelegram = useTelegram; }
}
