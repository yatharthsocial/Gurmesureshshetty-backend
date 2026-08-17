import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { upload } from '../lib/upload.js'
import { uploadImageBuffer } from '../lib/cloudinary.js'

export const grievancesRouter = Router()

const REQUIRED_FIELDS = ['name', 'phone', 'panchayat', 'issueType', 'details']
const CLOUDINARY_FOLDER = 'gurmesureshshetty/grievances'

function validateGrievanceInput(body) {
  const invalidFields = REQUIRED_FIELDS.filter(
    (field) => typeof body[field] !== 'string' || body[field].trim() === '',
  )
  return invalidFields
}

grievancesRouter.post('/', upload.single('image'), async (req, res, next) => {
  try {
    const invalidFields = validateGrievanceInput(req.body || {})
    if (invalidFields.length > 0) {
      return res.status(400).json({
        error: 'Missing or invalid fields',
        fields: invalidFields,
      })
    }

    const { name, phone, panchayat, issueType, details } = req.body

    let imageUrl = null
    if (req.file) {
      try {
        const result = await uploadImageBuffer(req.file.buffer, CLOUDINARY_FOLDER)
        imageUrl = result.secure_url
      } catch (uploadErr) {
        console.error('Cloudinary upload failed:', uploadErr)
        const err = new Error('Image upload failed. Please try again.')
        err.status = 502
        throw err
      }
    }

    const grievance = await prisma.grievance.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        panchayat: panchayat.trim(),
        issueType: issueType.trim(),
        details: details.trim(),
        imageUrl,
      },
    })

    res.status(201).json({ id: grievance.id })
  } catch (err) {
    next(err)
  }
})
