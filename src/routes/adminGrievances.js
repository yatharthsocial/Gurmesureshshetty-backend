import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

export const adminGrievancesRouter = Router()

const PAGE_SIZE = 20
const VALID_STATUSES = ['new', 'in_progress', 'resolved']
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function parsePage(raw) {
  const n = parseInt(raw, 10)
  return Number.isInteger(n) && n > 0 ? n : 1
}

function parseDate(raw, { endOfDay = false } = {}) {
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return { error: true }
  if (endOfDay && !raw.includes('T')) {
    date.setUTCHours(23, 59, 59, 999)
  }
  return { date }
}

adminGrievancesRouter.get('/grievances', async (req, res, next) => {
  try {
    const { status, panchayat, issueType, q, from, to } = req.query
    const page = parsePage(req.query.page)

    const where = {}

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        })
      }
      where.status = status
    }

    if (typeof panchayat === 'string' && panchayat.trim()) {
      where.panchayat = panchayat.trim()
    }

    if (typeof issueType === 'string' && issueType.trim()) {
      where.issueType = issueType.trim()
    }

    if (typeof q === 'string' && q.trim()) {
      const term = q.trim()
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
      ]
    }

    if (from !== undefined || to !== undefined) {
      where.createdAt = {}

      if (from !== undefined) {
        const parsed = parseDate(from)
        if (parsed.error) {
          return res.status(400).json({ error: 'Invalid "from" date' })
        }
        where.createdAt.gte = parsed.date
      }

      if (to !== undefined) {
        const parsed = parseDate(to, { endOfDay: true })
        if (parsed.error) {
          return res.status(400).json({ error: 'Invalid "to" date' })
        }
        where.createdAt.lte = parsed.date
      }
    }

    const [total, grievances] = await Promise.all([
      prisma.grievance.count({ where }),
      prisma.grievance.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
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

    res.json({
      data: grievances,
      pagination: {
        total,
        page,
        pageSize: PAGE_SIZE,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      },
    })
  } catch (err) {
    next(err)
  }
})

adminGrievancesRouter.get('/grievances/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    if (!UUID_RE.test(id)) {
      return res.status(404).json({ error: 'Grievance not found' })
    }

    const grievance = await prisma.grievance.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        panchayat: true,
        issueType: true,
        details: true,
        imageUrl: true,
        status: true,
        createdAt: true,
      },
    })

    if (!grievance) {
      return res.status(404).json({ error: 'Grievance not found' })
    }

    res.json(grievance)
  } catch (err) {
    next(err)
  }
})

adminGrievancesRouter.patch('/grievances/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body || {}

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      })
    }

    if (!UUID_RE.test(id)) {
      return res.status(404).json({ error: 'Grievance not found' })
    }

    const grievance = await prisma.grievance.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        name: true,
        phone: true,
        panchayat: true,
        issueType: true,
        details: true,
        imageUrl: true,
        status: true,
        createdAt: true,
      },
    })

    res.json(grievance)
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Grievance not found' })
    }
    next(err)
  }
})
