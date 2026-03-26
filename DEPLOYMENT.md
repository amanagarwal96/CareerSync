# 🚀 CareerSync Pro Production Deployment Guide

This guide outlines the professional path to deploying CareerSync Pro as a high-performance, scalable web application.

## 🏗️ Architecture Stack
*   **Frontend:** Next.js (Hosted on [Vercel](https://vercel.com) or Docker)
*   **Backend:** FastAPI (Hosted on [Railway](https://railway.app) or Docker)
*   **Database:** PostgreSQL (Hosted on [Supabase](https://supabase.com) - **Pooling Port: 6543 required**)
*   **Payments:** [Stripe](https://stripe.com)
*   **Email:** Professional SMTP (Gmail App Password with institution mail)

---

## 🛠️ Step 1: Database Setup (Supabase)
1.  Create a project on [Supabase](https://supabase.com).
2.  **CRITICAL**: Copy your **Connection String** from the `Database settings` -> `Connection Pooler`. 
    - Use the **Pooling Port: 6543**.
    - Append `&pgbouncer=true&connection_limit=1` to the URL.
    - Path: `postgresql://postgres.[REF]:[PASS]@[HOST]:6543/postgres?pgbouncer=true&connection_limit=1`
3.  In your `frontend/prisma/schema.prisma`, change the provider:
    ```prisma
    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }
    ```
4.  Run `npx prisma db push` to initialize your production schema.

## 🐋 Deployment via Docker (Recommended)
1.  Ensure Docker and Docker Compose are installed on your host.
2.  Prepare your `.env` with the pooling `DATABASE_URL` (Port 6543).
3.  Deploy the entire stack with a single command:
    ```bash
    docker-compose up -d --build
    ```
4.  **Verification**: Confirm services are live:
    - Frontend: `http://localhost:3000`
    - Backend: `http://localhost:8000`

## 🛠️ Step 3: Global Deployment (Vercel/Railway)
1.  Connect your GitHub repository to [Vercel](https://vercel.com).
2.  Deploy the `/frontend` folder.
3.  Add all variables from your `.env` to Vercel Settings:
    *   `DATABASE_URL`: Your Supabase connection string.
    *   `NEXTAUTH_SECRET`: Generate a random string.
    *   `NEXTAUTH_URL`: Your Vercel production URL.
    *   `STRIPE_SECRET_KEY`: Production Stripe key.
    *   `EMAIL_USER`: `amanbcs12211017@iiitsonepat.ac.in`
    *   `EMAIL_PASS`: Your institutional App Password.
    *   `NEXT_PUBLIC_BACKEND_URL`: Your Railway backend URL.

---

## 🛡️ Production Security Checklist
- [ ] **Stripe Webhooks:** Update the Stripe Webhook URL to point to `https://your-domain.com/api/stripe/webhook`.
- [ ] **Auth URLs:** Ensure `NEXTAUTH_URL` matches your custom domain.
- [ ] **App Passwords:** Verify the Gmail App Password for your university mail is active.
- [ ] **API Gating:** Ensure the FastAPI backend only accepts requests from your Vercel domain.

---

**Your platform is now ready to scale to millions of users!**
