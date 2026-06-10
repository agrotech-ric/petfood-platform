FROM gradle:8.5-jdk21 AS builder
WORKDIR /app
COPY . .
RUN gradle :services:auth:clean :services:auth:bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /app/services/auth/build/libs/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
