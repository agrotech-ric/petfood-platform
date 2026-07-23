package dev.pet.pets.domain;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "ingredients", schema = "pets")
public class Ingredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 128)
    private String category;
    @Column(nullable = false, length = 255)
    private String name;
    @Column(length = 255)
    private String subtype;

    private double portion;
    private double calories;
    private double protein;
    private double fat;
    private double carbs;
    private double moisture;
    private double fiber;
    private double ash;
    private double cholesterol;
    private double sugar;
    private double calcium;
    private double phosphorus;
    private double magnesium;
    private double sodium;
    private double potassium;
    private double iron;
    private double copper;
    private double zinc;
    private double manganese;
    private double linoleic;
    @Column(name = "alpha_linolenic") private double alphaLinolenic;
    private double arachidonic;
    private double epa;
    private double dha;
    private double choline;
    private double selenium;
    private double iodine;
    @Column(name = "vitamin_a") private double vitaminA;
    @Column(name = "vitamin_e") private double vitaminE;
    @Column(name = "vitamin_d") private double vitaminD;
    @Column(name = "vitamin_b1") private double vitaminB1;
    @Column(name = "vitamin_b2") private double vitaminB2;
    @Column(name = "vitamin_b3") private double vitaminB3;
    @Column(name = "vitamin_b5") private double vitaminB5;
    @Column(name = "vitamin_b6") private double vitaminB6;
    @Column(name = "vitamin_b9") private double vitaminB9;
    @Column(name = "vitamin_b12") private double vitaminB12;
    @Column(name = "vitamin_c") private double vitaminC;
    @Column(name = "vitamin_k") private double vitaminK;
    @Column(name = "alpha_carotene") private double alphaCarotene;
    @Column(name = "beta_carotene") private double betaCarotene;
    @Column(name = "beta_cryptoxanthin") private double betaCryptoxanthin;
    @Column(name = "lutein_zeaxanthin") private double luteinZeaxanthin;
    private double lycopene;
    private double retinol;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public Long getId() { return id; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSubtype() { return subtype; }
    public void setSubtype(String subtype) { this.subtype = subtype; }
    public double getPortion() { return portion; }
    public void setPortion(double portion) { this.portion = portion; }
    public double getCalories() { return calories; }
    public void setCalories(double calories) { this.calories = calories; }
    public double getProtein() { return protein; }
    public void setProtein(double protein) { this.protein = protein; }
    public double getFat() { return fat; }
    public void setFat(double fat) { this.fat = fat; }
    public double getCarbs() { return carbs; }
    public void setCarbs(double carbs) { this.carbs = carbs; }
    public double getMoisture() { return moisture; }
    public void setMoisture(double moisture) { this.moisture = moisture; }
    public double getFiber() { return fiber; }
    public void setFiber(double fiber) { this.fiber = fiber; }
    public double getAsh() { return ash; }
    public void setAsh(double ash) { this.ash = ash; }
    public double getCholesterol() { return cholesterol; }
    public void setCholesterol(double cholesterol) { this.cholesterol = cholesterol; }
    public double getSugar() { return sugar; }
    public void setSugar(double sugar) { this.sugar = sugar; }
    public double getCalcium() { return calcium; }
    public void setCalcium(double calcium) { this.calcium = calcium; }
    public double getPhosphorus() { return phosphorus; }
    public void setPhosphorus(double phosphorus) { this.phosphorus = phosphorus; }
    public double getMagnesium() { return magnesium; }
    public void setMagnesium(double magnesium) { this.magnesium = magnesium; }
    public double getSodium() { return sodium; }
    public void setSodium(double sodium) { this.sodium = sodium; }
    public double getPotassium() { return potassium; }
    public void setPotassium(double potassium) { this.potassium = potassium; }
    public double getIron() { return iron; }
    public void setIron(double iron) { this.iron = iron; }
    public double getCopper() { return copper; }
    public void setCopper(double copper) { this.copper = copper; }
    public double getZinc() { return zinc; }
    public void setZinc(double zinc) { this.zinc = zinc; }
    public double getManganese() { return manganese; }
    public void setManganese(double manganese) { this.manganese = manganese; }
    public double getLinoleic() { return linoleic; }
    public void setLinoleic(double linoleic) { this.linoleic = linoleic; }
    public double getAlphaLinolenic() { return alphaLinolenic; }
    public void setAlphaLinolenic(double alphaLinolenic) { this.alphaLinolenic = alphaLinolenic; }
    public double getArachidonic() { return arachidonic; }
    public void setArachidonic(double arachidonic) { this.arachidonic = arachidonic; }
    public double getEpa() { return epa; }
    public void setEpa(double epa) { this.epa = epa; }
    public double getDha() { return dha; }
    public void setDha(double dha) { this.dha = dha; }
    public double getCholine() { return choline; }
    public void setCholine(double choline) { this.choline = choline; }
    public double getSelenium() { return selenium; }
    public void setSelenium(double selenium) { this.selenium = selenium; }
    public double getIodine() { return iodine; }
    public void setIodine(double iodine) { this.iodine = iodine; }
    public double getVitaminA() { return vitaminA; }
    public void setVitaminA(double vitaminA) { this.vitaminA = vitaminA; }
    public double getVitaminE() { return vitaminE; }
    public void setVitaminE(double vitaminE) { this.vitaminE = vitaminE; }
    public double getVitaminD() { return vitaminD; }
    public void setVitaminD(double vitaminD) { this.vitaminD = vitaminD; }
    public double getVitaminB1() { return vitaminB1; }
    public void setVitaminB1(double vitaminB1) { this.vitaminB1 = vitaminB1; }
    public double getVitaminB2() { return vitaminB2; }
    public void setVitaminB2(double vitaminB2) { this.vitaminB2 = vitaminB2; }
    public double getVitaminB3() { return vitaminB3; }
    public void setVitaminB3(double vitaminB3) { this.vitaminB3 = vitaminB3; }
    public double getVitaminB5() { return vitaminB5; }
    public void setVitaminB5(double vitaminB5) { this.vitaminB5 = vitaminB5; }
    public double getVitaminB6() { return vitaminB6; }
    public void setVitaminB6(double vitaminB6) { this.vitaminB6 = vitaminB6; }
    public double getVitaminB9() { return vitaminB9; }
    public void setVitaminB9(double vitaminB9) { this.vitaminB9 = vitaminB9; }
    public double getVitaminB12() { return vitaminB12; }
    public void setVitaminB12(double vitaminB12) { this.vitaminB12 = vitaminB12; }
    public double getVitaminC() { return vitaminC; }
    public void setVitaminC(double vitaminC) { this.vitaminC = vitaminC; }
    public double getVitaminK() { return vitaminK; }
    public void setVitaminK(double vitaminK) { this.vitaminK = vitaminK; }
    public double getAlphaCarotene() { return alphaCarotene; }
    public void setAlphaCarotene(double alphaCarotene) { this.alphaCarotene = alphaCarotene; }
    public double getBetaCarotene() { return betaCarotene; }
    public void setBetaCarotene(double betaCarotene) { this.betaCarotene = betaCarotene; }
    public double getBetaCryptoxanthin() { return betaCryptoxanthin; }
    public void setBetaCryptoxanthin(double betaCryptoxanthin) { this.betaCryptoxanthin = betaCryptoxanthin; }
    public double getLuteinZeaxanthin() { return luteinZeaxanthin; }
    public void setLuteinZeaxanthin(double luteinZeaxanthin) { this.luteinZeaxanthin = luteinZeaxanthin; }
    public double getLycopene() { return lycopene; }
    public void setLycopene(double lycopene) { this.lycopene = lycopene; }
    public double getRetinol() { return retinol; }
    public void setRetinol(double retinol) { this.retinol = retinol; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
