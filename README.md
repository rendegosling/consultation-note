# Consultation Note

A simplified consultation note-taking application that allows recording sessions, taking notes, and generating consultation summaries.

## Prerequisites
- Docker Desktop (or equivalent Docker + Docker Compose installation)

## Quick Start
1. Clone the repository
2. Run:
```bash
docker compose up --build
```
3. Wait for services to be ready:
   - Backend will show: "Server running on port 5000"
   - Frontend will show: "ready - started server on 0.0.0.0:3000"

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health check: http://localhost:5000/health

## Default Credentials
```
Username: admin
Password: password
```

## Project Structure
```
.
├── frontend/          # Next.js frontend application
├── backend/           # Express.js backend API
├── docs/             # Documentation
└── docker-compose.yml # Docker Compose configuration
```

## Documentation
- [Design Doc](./docs/design-doc.md)

## Notes
- LocalStack is used to simulate AWS services locally
- Audio is processed in 15-second chunks
- Basic Auth is implemented for API security
