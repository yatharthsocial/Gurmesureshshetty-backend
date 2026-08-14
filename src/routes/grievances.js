import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

export const grievancesRouter = Router()

const REQUIRED_FIELDS = ['name', 'phone', 'panchayat', 'issueType', 'details']

function validateGrievanceInput(body) {
  const invalidFields = REQUIRED_FIELDS.filter(
    (field) => typeof body[field] !== 'string' || body[field].trim() === '',
  )
  return invalidFields
}

grievancesRouter.post('/', async (req, res, next) => {
  try {
    const invalidFields = validateGrievanceInput(req.body || {})
    if (invalidFields.length > 0) {
      return res.status(400).json({
        error: 'Missing or invalid fields',
        fields: invalidFields,
      })
    }

    const { name, phone, panchayat, issueType, details } = req.body

    const grievance = await prisma.grievance.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        panchayat: panchayat.trim(),
        issueType: issueType.trim(),
        details: details.trim(),
      },
    })

    res.status(201).json({ id: grievance.id })
  } catch (err) {
    next(err)
  }
})
