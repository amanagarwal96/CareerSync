# 🚀 CareerSync Pro Production Deployment Guide

This guide outlines the professional path to deploying CareerSync Pro as a high-performance, scalable web application.

## 🏗️ Architecture Stack
*   **Frontend:** Next.js (Hosted on [Vercel](https://vercel.com))
*   **Backend:** FastAPI (Hosted on [Railway](https://railway.app) or Render)
*   **Database:** PostgreSQL (Hosted on [Supabase](https://supabase.com) or Neon)
*   **Payments:** [Stripe](https://stripe.com)
*   **Email:** Professional SMTP (University Mail / Resend / SendGrid)

---

## 🛠️ Step 1: Database Setup (Supabase)
1.  Create a project on [Supabase](https://supabase.com).
2.  Copy your **Connection String** (Transaction mode).
3.  In your `frontend/prisma/schema.prisma`, change the provider:
    ```prisma
    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }
    ```
4.  Run `npx prisma db push` to initialize your production schema.

## 🛠️ Step 2: Backend Deployment (Railway)
1.  Connect your GitHub repository to [Railway](https://railway.app).
2.  Deploy the `/backend` folder.
3.  Add the following Environment Variables in Railway:
    *   `OPENAI_API_KEY`: Your production OpenAI key.
    *   `NEXT_PUBLIC_BACKEND_URL`: The URL provided by Railway.

## 🛠️ Step 3: Frontend Deployment (Vercel)
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
