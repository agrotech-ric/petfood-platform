package dev.pet.pets.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class PetOwnerRequest {
    @NotBlank @Size(max = 200)
    private String fullName;
    @Size(max = 100) private String country;
    @Size(max = 100) private String city;
    @Size(max = 300) private String address;
    @Size(max = 32) @Pattern(regexp = "^$|^\\+?[1-9]\\d{9,14}$") private String phone;
    @Size(max = 254) @Email private String email;
    @Size(max = 100)
    @Pattern(
        regexp = "^$|^(?:@[A-Za-z0-9_]{5,32}|\\+?[1-9]\\d{9,14})$",
        message = "must be a Telegram @username or phone number"
    )
    private String telegram;
    @Size(max = 512) private String avatarObjectKey;

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getTelegram() { return telegram; }
    public void setTelegram(String telegram) { this.telegram = telegram; }
    public String getAvatarObjectKey() { return avatarObjectKey; }
    public void setAvatarObjectKey(String avatarObjectKey) { this.avatarObjectKey = avatarObjectKey; }
}
