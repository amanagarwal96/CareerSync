# 🌟 CareerSync Pro: Project Overview & Features

Welcome to the **CareerSync Pro** documentation! This guide is written so that absolutely anyone—whether you are a student, a recruiter, or just curious—can easily understand what this platform does and why it was built. 

At the bottom of this file, you will also find a secret "Master Blueprint" prompt that you can give to any AI to perfectly rebuild this entire project from scratch!

---

## 🎯 What is CareerSync Pro?
Imagine having a highly intelligent, personal career coach available 24/7. **CareerSync Pro** is exactly that. It's an advanced AI web application designed to help job seekers land their dream jobs by actively acting as a recruiter, resume reviewer, and mock interviewer all at once!

It uses artificial intelligence (like ChatGPT) to read a user's resume, figure out exactly what they are missing for a specific job, and then helps them perfectly prepare for the technical interview.

---

## ✨ Features Explained (In Plain English)

Here is a simple breakdown of every single magical feature inside the app:

### 1. 🛡️ User Accounts & Security (Authentication)
**What it does:** Users can securely sign up, log in, and manage their personal details. 
**How it works:** Think of this as the digital lock on your house. We use a secure database to safely store user information so that nobody else can access your personalized resumes or payment details data but you.

### 2. 🧠 Intelligent Resume Analyzer (ATS Hub)
**What it does:** It grades your resume against a specific job you actually want, just like a real company's automated software would.
**How it works:** You upload your PDF resume and tell the app, "I want to be a Software Engineer at Google." The AI instantly reads your resume, gives you a score out of 100, tells you *exactly* what keywords you are missing, and even rewrites your weakest bullet points to make them sound significantly more professional and impactful.

### 3. ✍️ AI Cover Letter Generator
**What it does:** Automatically writes a beautiful, highly personalized cover letter for you in seconds.
**How it works:** Instead of staring at a blank page, the AI takes your uploaded resume and the job you are applying for, figures out the company’s core values, and beautifully writes a custom 3-paragraph letter. It also gives you a personalized "Career Map" predicting your future career trajectory.

### 4. 🕵️‍♂️ GitHub Recruiter Verification Engine
**What it does:** Proves you aren't lying on your resume by checking your actual coding projects!
**How it works:** If you say you know "Python" or "React", the app connects directly to your public GitHub profile (where programmers store their code) and silently scans all your projects. It then calculates a "Verification Score" showing recruiters verified proof of your coding skills!

### 5. 🎤 Real-Time AI Mock Interview
**What it does:** Puts you through a realistic interview chat and actively grades your answers.
**How it works:** You pretend you are in an interview for your dream role. The AI asks a deep technical question. You type or speak your answer. The AI instantly evaluates your confidence, checks if you use too many "filler words" (like *um* or *uh*), and gives you actionable tips on how to improve on your next turn!

### 6. 💳 Premium Memberships (Stripe Payments)
**What it does:** Allows users to upgrade to "CareerSync Pro Premium" by securely paying with a credit card.
**How it works:** We integrated Stripe (the same payment system companies like Amazon or Netflix use) so users can check out safely. Once they pay, the system instantly upgrades their account in the database to unlock infinite AI usage!

---
---

## 🤖 The "Master Blueprint" AI Prompt

*If you ever want to rebuild this entire project from scratch, copy the text below and paste it into an AI like ChatGPT or Claude:*

> **"Act as an Elite Full-Stack Systems Architect and UI Engineer. I want you to build 'CareerSync Pro', a next-generation AI-powered career platform designed to help job seekers land roles through intelligent ATS parsing, automated cover letter generation, GitHub verification, and real-time AI mock interviews.**
>
> **You must use the following Technology Stack:**
> - **Architecture:** Monorepo using Docker Compose (Frontend, Backend, Postgres Database, Redis Cache).
> - **Frontend:** Next.js 14 (App Router), React 19, Tailwind CSS v4, Framer Motion, Recharts, Lucide React.
> - **Backend:** Python 3.11+, FastAPI, PostgreSQL, Redis.
> - **Authentication:** Next-Auth (v4) Credentials Provider backed by Prisma ORM.
> - **Payments:** Stripe integration and Webhooks for premium features.
> - **AI Integration:** OpenAI GPT-4o API for all generational features, PyPDF for parsing.
>
> **Design & UI System:**
> - Implement a highly premium 'Neo-Glassmorphism' dark mode aesthetic. Utilize deep dark colors (`#0A0A0B`), ambient radial gradients, heavy use of backdrop blurs (`backdrop-blur-xl`), and subtle translucent borders (`border-white/10`).
> - Use standard sans-serif variable fonts (e.g., Inter) for body text and bold display fonts (e.g., Outfit) for headings.
> - All UI interactions must feel buttery-smooth, utilizing Framer Motion for layout transitions, stagger lists, and hover micro-interactions.
>
> **Core Features to Implement (Develop endpoints and polished UIs for each):**
> 
> **1. Authentication System (Next-Auth + Prisma)**
> - Implement full Credentials-based login and registration.
> - Users and Sessions must be stored in PostgreSQL using Prisma Adapter.
>
> **2. Intelligent ATS Resume Analyzer (FastAPI `/api/analyze-resume`)**
> - Allow users to upload a PDF resume (parsed via PyPDF) or paste raw text.
> - Call OpenAI GPT-4o with the resume text and a Target Job Description.
> - Return and render a JSON payload containing:
>   - An overall ATS match score (0-100 gauge chart).
>   - Missing keyword gaps.
>   - 4 specific "AI Magic Rewrites" (transforming weak resume bullets into impactful metric-driven statements).
>
> **3. Cover Letter Generator (FastAPI `/api/cover-letter`)**
> - Take a resume and target role.
> - Use OpenAI to generate a highly personalized, compelling 3-paragraph cover letter targeting specific inferred company values.
> - Display a "Career Map" predicting the user's trajectory, current role, and skills missing to reach their director-level future.
>
> **4. GitHub Verification Engine (FastAPI `/api/recruiter-verify`)**
> - Use OpenAI to recursively extract all technical skills claimed on a resume.
> - Fetch the user's public repositories natively from the GitHub API using `httpx`.
> - Cross-reference the skills to find "evidence" (languages used or repo descriptions matching the skill).
> - Render a "Verification Score" and a detailed list of verified vs. unverified skills.
>
> **5. Real-Time AI Mock Interview (FastAPI `/api/interview/chat`)**
> - Provide a chat/speech interface simulating an immersive technical interview for a specific role.
> - Send transcript history to OpenAI. AI must respond with the *next* deep technical interview question.
> - AI must silently return a real-time behavioral analysis on the user's previous answer (assessing filler words, speaking pace, and confidence score, returning a proactive tip).
>
> **6. Stripe Payments (Next.js `/api/stripe`)**
> - Implement Stripe Checkout sessions for users upgrading to Pro (unlocking infinite AI usage).
> - Implement a secure Stripe webhook listener to update the Prisma user database upon successful payment.
> 
> **Please structure the codebase effectively, provide the `docker-compose.yml`, write all `Dockerfile`s optimized for caching and cross-OS compatibility (use `node:20-bookworm-slim` for frontend, include `openssl` for Prisma), and give me the code file by file."**
