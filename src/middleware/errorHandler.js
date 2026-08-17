import multer from 'multer'

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error(err)

  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Image must be smaller than 5MB'
        : 'Invalid image upload'
    return res.status(400).json({ error: message })
  }

  const status = err.status || 500
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
  })
}
