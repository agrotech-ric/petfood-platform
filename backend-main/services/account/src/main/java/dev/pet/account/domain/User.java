package dev.pet.account.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users",
    uniqueConstraints = @UniqueConstraint(name = "uk_users_email", columnNames = "email"))
public class User extends BaseEntity {

    @Email
    @NotBlank
    @Column(nullable = false, length = 254)
    private String email;

    @NotBlank
    @Column(nullable = false, length = 60)
    private String passwordHash;

    @Column(name = "first_name", length = 64)
    private String firstName;

    @Column(name = "last_name", length = 64)
    private String lastName;

    //@Column(length = 12, unique = true)
    //private String iin;

    @Column(name = "enable_2fa", nullable = false)
    private boolean enable2fa = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private UserStatus status = UserStatus.PENDING_VERIFICATION;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 32)
    private Role role = Role.USER;

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }


    // getters/setters

    public String getEmail() { return email; }
    public void setEmail(String email) {
        this.email = email == null ? null : email.trim().toLowerCase();
    }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) {
        this.firstName = firstName == null ? null : firstName.trim();
    }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) {
        this.lastName = lastName == null ? null : lastName.trim();
    }

/*
    public String getIin() { return iin; }
    public void setIin(String iin) {
        this.iin = iin == null ? null : iin.trim();
    }
*/
    public boolean isEnable2fa() { return enable2fa; }
    public void setEnable2fa(boolean enable2fa) { this.enable2fa = enable2fa; }

    public UserStatus getStatus() { return status; }
    public void setStatus(UserStatus status) { this.status = status; }

}
