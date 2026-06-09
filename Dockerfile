# Build from repo root so Flyway can access database/migration
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY backend/pom.xml backend/pom.xml
COPY backend/src backend/src
RUN mvn -f backend/pom.xml -DskipTests dependency:go-offline

COPY database/migration database/migration
RUN mvn -f backend/pom.xml -DskipTests clean package

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

RUN mkdir -p /var/data/uploads

COPY --from=build /app/backend/target/simple-survey-api-0.0.1-SNAPSHOT.jar app.jar
COPY --from=build /app/database/migration /database/migration

ENV FLYWAY_MIGRATIONS_PATH=/database/migration
ENV FILE_UPLOAD_PATH=/var/data/uploads

EXPOSE 8080

CMD ["sh", "-c", "java -jar app.jar --server.port=${PORT:-8080}"]
