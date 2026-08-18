FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build

# Maven multi-module reactor needs ALL module POMs + parent POM
COPY pom.xml .
COPY eureka-service/pom.xml eureka-service/pom.xml
COPY api-gateway/pom.xml api-gateway/pom.xml
COPY auth-service/pom.xml auth-service/pom.xml
COPY user-service/pom.xml user-service/pom.xml
COPY matching-service/pom.xml matching-service/pom.xml
COPY nest-service/pom.xml nest-service/pom.xml
COPY chat-service/pom.xml chat-service/pom.xml
COPY notification-service/pom.xml notification-service/pom.xml

# Copy source and build only this service
COPY matching-service/src matching-service/src
RUN mvn -pl matching-service clean package -DskipTests -B

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /build/matching-service/target/matching-service.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]
