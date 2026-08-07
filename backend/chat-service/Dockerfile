FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app
COPY target/chat-service-0.0.1-SNAPSHOT.jar chat-service.jar
EXPOSE 8085
ENTRYPOINT ["java", "-jar", "chat-service.jar"]
