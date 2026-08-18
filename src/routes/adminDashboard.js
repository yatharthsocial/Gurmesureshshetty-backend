import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

export const adminDashboardRouter = Router()

const RECENT_LIMIT = 8

adminDashboardRouter.get('/dashboard', async (req, res, next) => {
  try {
    const [grouped, recent] = await Promise.all([
      prisma.grievance.groupBy({ by: ['status'], _count: true }),
      prisma.grievance.findMany({
        orderBy: { createdAt: 'desc' },
        take: RECENT_LIMIT,
        select: {
          id: true,
          name: true,
          phone: true,
          panchayat: true,
          issueType: true,
          status: true,
          imageUrl: true,
          createdAt: true,
        },
      }),
    ])

    const counts = { new: 0, in_progress: 0, resolved: 0 }
    for (const g of grouped) {
      counts[g.status] = g._count
    }
    const total = counts.new + counts.in_progress + counts.resolved

    res.json({
      total,
      new: counts.new,
      inProgress: counts.in_progress,
      resolved: counts.resolved,
      recent,
    })
  } catch (err) {
    next(err)
  }
})
