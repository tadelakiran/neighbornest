# Stage 1: Build the application
# Build context must be the repository root (backend/) so the parent POM is available.
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build
COPY pom.xml .
# Copy every module's POM so Maven can resolve the full reactor. The parent
# POM lists all 6 modules and Maven hard-fails with "Child module ... does
# not exist" if any sibling pom is missing from the build context.
COPY eureka-service/pom.xml eureka-service/pom.xml
COPY api-gateway/pom.xml api-gateway/pom.xml
COPY auth-service/pom.xml auth-service/pom.xml
COPY user-service/pom.xml user-service/pom.xml
COPY matching-service/pom.xml matching-service/pom.xml
COPY nest-service/pom.xml nest-service/pom.xml
RUN mvn -q -pl user-service dependency:go-offline -B
COPY user-service/src user-service/src
RUN mvn -pl user-service clean package -DskipTests -B

# Stage 2: Run the application
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /build/user-service/target/user-service.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
