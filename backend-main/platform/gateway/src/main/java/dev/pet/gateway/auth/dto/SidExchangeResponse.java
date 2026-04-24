package dev.pet.gateway.auth.dto;

public class SidExchangeResponse {
    private String token;
    private Long exp;

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public Long getExp() { return exp; }
    public void setExp(Long exp) { this.exp = exp; }
}
