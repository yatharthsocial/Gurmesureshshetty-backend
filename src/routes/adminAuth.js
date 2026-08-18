import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'

export const adminAuthRouter = Router()

adminAuthRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {}

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const admin = await prisma.admin.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    const genericError = () => res.status(401).json({ error: 'Invalid email or password' })

    if (!admin) return genericError()

    const passwordMatches = await bcrypt.compare(password, admin.passwordHash)
    if (!passwordMatches) return genericError()

    const token = jwt.sign({ sub: admin.id, email: admin.email }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    })

    res.json({ token })
  } catch (err) {
    next(err)
  }
})
