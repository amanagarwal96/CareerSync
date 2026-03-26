import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"
import { compare } from "bcryptjs"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
      aiMode: string
      discovery: boolean
      subscriptionTier: string
      stripeCustomerId: string | null
    }
  }

  interface User {
    role: string
    aiMode: string
    discovery: boolean
    subscriptionTier: string
    stripeCustomerId: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    aiMode: string
    discovery: boolean
    subscriptionTier: string
    stripeCustomerId: string | null
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Sign in",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "hello@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          aiMode: user.aiMode,
          discovery: user.discovery,
          subscriptionTier: user.subscriptionTier,
          stripeCustomerId: user.stripeCustomerId,
        }
      }
    })
  ],
  callbacks: {
    session: ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
          aiMode: token.aiMode,
          discovery: token.discovery,
        }
      }
    },
    jwt: ({ token, user }) => {
      if (user) {
        return {
          ...token,
          id: user.id,
          role: (user as any).role,
          aiMode: (user as any).aiMode,
          discovery: (user as any).discovery,
          subscriptionTier: (user as any).subscriptionTier,
          stripeCustomerId: (user as any).stripeCustomerId,
        }
      }
      return token
    }
  }
}
