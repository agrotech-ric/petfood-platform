package dev.pet.account.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public class AdminUserItemResponse {
    private UUID id;
    private String email;
    private String fullName;
   // private String iin;
    private String role;
    private OffsetDateTime createdAt;
    private boolean editable;

    public AdminUserItemResponse(
        UUID id,
        String email,
        String fullName,
      //  String iin,
        String role,
        OffsetDateTime createdAt,
        boolean editable
    ) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
    //    this.iin = iin;
        this.role = role;
        this.createdAt = createdAt;
        this.editable = editable;
    }

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
   // public String getIin() { return iin; }
    public String getRole() { return role; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public boolean isEditable() { return editable; }
}
