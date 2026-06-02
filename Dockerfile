FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn clean package -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S nba-scoreboard && adduser -S nba-scoreboard -G nba-scoreboard
COPY --from=build --chown=nba-scoreboard:nba-scoreboard /app/target/*.jar app.jar
USER nba-scoreboard
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
