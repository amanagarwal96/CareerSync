# CareerSync Pro - The Billion-Dollar AI Career Suite

CareerSync Pro is a next-generation AI-powered career platform designed to help job seekers land their dream roles through intelligent ATS parsing, automated cover letter generation, and real-time AI mock interviews.

## 🚀 Key Features

1. **ATS Intelligence Hub**: Analyzes resumes against job descriptions, identifying keyword gaps and suggesting "AI Magic Rewrites" for maximum impact.
2. **Personal Career Strategist**: Dynamically models your career trajectory and generates hyper-personalized cover letters utilizing OpenAI/Anthropic models.
3. **Interview Mastery**: An immersive, real-time audio/video mock interview environment providing live biometric and semantic feedback.
4. **GitHub Verification Engine**: Connects to your GitHub profile to automatically verify claimed skills based on historical code contributions.
5. **Neo-Glassmorphism UI**: A visually stunning, buttery-smooth user interface built with Tailwind CSS v4 and Framer Motion.

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS v4, Lucide React, Recharts.
- **Backend**: Python 3.11, FastAPI, Pydantic, PyTest.
- **Database & Cache**: PostgreSQL, Redis (infrastructure scaffolded via Docker).
- **Architecture**: Monorepo deployed via Docker Compose.

## 📦 Local Development

### Prerequisites
- [Docker & Docker Compose](https://www.docker.com/)
- [Node.js](https://nodejs.org/) (for local frontend dev)
- [Python 3.11+](https://www.python.org/) (for local backend dev)

### Getting Started

You can run the entire infrastructure with a single Docker Compose command:

```bash
docker-compose up --build
```

This will spin up:
- **Frontend** at `http://localhost:3000`
- **FastAPI Backend** at `http://localhost:8000`
- **PostgreSQL** on port `5432`
- **Redis** on port `6379`

### Environment Variables

If running locally without Docker:
- Create `.env.local` in `/frontend` (e.g., `NEXT_PUBLIC_API_URL=http://localhost:8000`)
- Create `.env` in `/backend` (e.g., `DATABASE_URL`, `OPENAI_API_KEY`)

## 🎨 Design System Guide

We employ a "Neo-Glassmorphism" aesthetic built natively on Tailwind CSS v4:
- Primary Color: `#3B82F6` (Blue)
- Secondary Color: `#10B981` (Emerald)
- Background: Deep Dark `#0A0A0B` with ambient radial gradients.
- Global Fonts: `Inter` for body copy, `Outfit` for display headings.

## 🧪 Testing

### Frontend
```bash
cd frontend
npm run build # Validates types and builds the app
```

### Backend
```bash
cd backend
pytest test_main.py # Validates the API endpoints
```
