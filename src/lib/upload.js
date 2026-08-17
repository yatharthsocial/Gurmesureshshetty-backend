import multer from 'multer'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      const err = new Error('Only JPEG, PNG, and WEBP images are allowed')
      err.status = 400
      return cb(err)
    }
    cb(null, true)
  },
})
