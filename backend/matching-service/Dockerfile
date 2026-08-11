# syntax=docker/dockerfile:1
# Stage 1: Build the application
# Build context must be the repository root (backend/) so the parent POM is available.
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build
COPY pom.xml .
# Copy every module's POM so Maven can resolve the full reactor. The parent
# POM lists all 8 modules and Maven hard-fails with "Child module ... does
# not exist" if any sibling pom is missing from the build context.
COPY eureka-service/pom.xml eureka-service/pom.xml
COPY api-gateway/pom.xml api-gateway/pom.xml
COPY auth-service/pom.xml auth-service/pom.xml
COPY user-service/pom.xml user-service/pom.xml
COPY matching-service/pom.xml matching-service/pom.xml
COPY nest-service/pom.xml nest-service/pom.xml
COPY chat-service/pom.xml chat-service/pom.xml
COPY notification-service/pom.xml notification-service/pom.xml
# The cache mount shares one Maven local repo (~/.m2) across every service
# build, so dependencies are downloaded only once.
# - The maven:3.9 builder image is pinned on purpose: dependency:go-offline
#   is deprecated in Maven 3.9 and removed in Maven 4, so don't bump it blindly.
# - -U makes Maven re-attempt artifacts whose download failed previously, and
#   the retry loops absorb flaky Maven Central connections.
RUN --mount=type=cache,target=/root/.m2 sh -c 'for i in 1 2 3 4 5; do mvn -q -pl matching-service dependency:go-offline -B -U && exit 0 || echo "go-offline attempt $i failed, retrying..."; done; echo "go-offline failed after 5 attempts"; exit 1'
COPY matching-service/src matching-service/src
RUN --mount=type=cache,target=/root/.m2 sh -c 'for i in 1 2 3; do mvn -pl matching-service clean package -DskipTests -B && exit 0 || echo "package attempt $i failed, retrying..."; done; echo "package failed after 3 attempts"; exit 1'

# Stage 2: Run the application
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /build/matching-service/target/matching-service.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]
