FROM gradle:8.5-jdk21 AS builder
WORKDIR /app
COPY . .
RUN gradle :platform:gateway:clean :platform:gateway:bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /app/platform/gateway/build/libs/*.jar app.jar
EXPOSE 8090
ENTRYPOINT ["java", "-jar", "app.jar"]
