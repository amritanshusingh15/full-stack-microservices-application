# Full Stack Woo Segments (MERN)

A full-stack microservices application that:

- Ingests products from a WooCommerce site (provided test store)
- Stores them locally in MongoDB with required field names
- Exposes `GET /products` and `POST /segments/evaluate`
- Provides a React frontend with a text-based segment editor
- Periodically ingests products using cron
- Provides Swagger API docs
- Dockerized and includes docker-compose for local dev

## Live demo

deploy backend to Render-:https://full-stack-microservices-application.onrender.com/ <br>
frontend to Vercel link-:https://full-stack-microservices-applicatio-ruddy.vercel.app/

## Architecture

- `backend/` — Express + Mongoose microservice
  - `GET /products` — returns all stored products
  - `POST /segments/evaluate` — accepts a `rules` string (one condition per line) and returns filtered products
  - Cron ingestion using `node-cron`
  - Swagger docs at `/api-docs`
- `frontend/` — React app (Vite)
  - Product cards display
  - TextArea-based Segment Editor (one condition per line)
  - Prettified JSON result area

## Setup (local, using docker-compose)

1. Copy `.env.example` to `.env` and fill in WooCommerce credentials provided.
2. Start services:

```bash
docker-compose up --build
```
## AI Usage Note

This project was partially assisted using ChatGPT (GPT-5) for support in understanding requirements and resolving development issues.

a. Tool used:

- ChatGPT (GPT-5)

b. What it generated:

- Helped explain and debug Docker, Render, and Vercel deployment issues.
- Provided guidance for configuring docker-compose.yml, Dockerfile, and .env variables.
- Suggested fixes for Node.js, Express, and MongoDB connection errors.
- Offered code snippets and explanations for frontend–backend integration using the MERN stack.

c. What I modified or improved myself:

- Wrote and organized all source code for backend and frontend.
- Configured environment variables, MongoDB Atlas, and Render/Vercel settings.
- Implemented final logic, error handling, and deployment setup manually after understanding.
- Verified and tested each feature and configuration independently before submission.
