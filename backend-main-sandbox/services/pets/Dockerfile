FROM gradle:8.5-jdk21 AS builder
WORKDIR /app
COPY . .
RUN gradle :services:pets:clean :services:pets:bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /app/services/pets/build/libs/*.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]
