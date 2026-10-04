FROM node:26-alpine AS frontend
WORKDIR /app
copy frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend
WORKDIR /src
COPY backend/*.csproj ./
RUN dotnet restore
COPY backend/ ./
RUN dotnet publish -c Release -o /publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=backend /publish ./
COPY --from=frontend /app/dist ./wwwroot
EXPOSE 8080
ENTRYPOINT ["dotnet", "backend.dll"]