import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  db_instance: PrismaClient | undefined
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

export const db = globalForPrisma.db_instance ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.db_instance = db
