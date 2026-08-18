import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma.js'

const email = process.env.SEED_ADMIN_EMAIL
const password = process.env.SEED_ADMIN_PASSWORD

if (!email || !password) {
  console.error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD env vars before running this script.')
  process.exit(1)
}

const passwordHash = await bcrypt.hash(password, 10)

const admin = await prisma.admin.upsert({
  where: { email: email.trim().toLowerCase() },
  update: { passwordHash },
  create: { email: email.trim().toLowerCase(), passwordHash },
})

console.log(`Admin account ready: ${admin.email}`)
await prisma.$disconnect()
