package dev.pet.gateway.auth.dto;

public class SidExchangeRequest {
    private String sid;

    public SidExchangeRequest() {}
    public SidExchangeRequest(String sid) { this.sid = sid; }

    public String getSid() { return sid; }
    public void setSid(String sid) { this.sid = sid; }
}
