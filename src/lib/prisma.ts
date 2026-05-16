import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL
  
  if (!connectionString) {
    throw new Error('DATABASE_URL or DIRECT_URL environment variable is required')
  }

  // Kiểm tra xem có đang chạy trên máy cá nhân không
  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1')

  const pool = new Pool({ 
    connectionString,
    // Bypass lỗi "self-signed certificate" trên Vercel khi gọi đến Supabase
    ssl: isLocal ? undefined : { rejectUnauthorized: false }
  })
  
  const adapter = new PrismaPg(pool)
  
  return new PrismaClient({ adapter })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
