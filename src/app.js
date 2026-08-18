import express from 'express'
import cors from 'cors'
import { healthRouter } from './routes/health.js'
import { grievancesRouter } from './routes/grievances.js'
import { adminAuthRouter } from './routes/adminAuth.js'
import { adminDashboardRouter } from './routes/adminDashboard.js'
import { adminGrievancesRouter } from './routes/adminGrievances.js'
import { requireAdminAuth } from './middleware/requireAdminAuth.js'
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js'

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

export const app = express()

app.use(
  cors({
    origin(origin, callback) {
      // allow non-browser requests (e.g. curl, server-to-server) with no Origin header
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`))
      }
    },
  }),
)
app.use(express.json())

app.use(healthRouter)
app.use('/api/grievances', grievancesRouter)
app.use('/api/admin', adminAuthRouter)
app.use('/api/admin', requireAdminAuth, adminDashboardRouter)
app.use('/api/admin', requireAdminAuth, adminGrievancesRouter)

app.use(notFoundHandler)
app.use(errorHandler)
