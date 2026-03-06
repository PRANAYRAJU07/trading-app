# ---- Build stage ----
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
COPY .mvn/ .mvn/
COPY mvnw mvnw
COPY src/ src/

RUN chmod +x mvnw && ./mvnw -DskipTests package

# ---- Runtime stage ----
FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=build /app/target/trading-platform-1.0.0.jar /app/app.jar

ENV PORT=8080
EXPOSE 8080

CMD ["java","-jar","/app/app.jar"]
