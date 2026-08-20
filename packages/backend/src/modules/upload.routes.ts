import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`)
  }
})

const allowedMimeTypes = new Set([
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain', 'text/csv',
])
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) return cb(new Error('Unsupported file type'))
    cb(null, true)
  },
})

export const uploadRouter = Router()

uploadRouter.use(authMiddleware)

uploadRouter.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' })
  res.json({ fileName: req.file.originalname, storedName: req.file.filename, size: req.file.size, path: `/uploads/${req.file.filename}` })
})

uploadRouter.post('/upload/logo', upload.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' })
  res.json({ fileName: req.file.originalname, storedName: req.file.filename, path: `/uploads/${req.file.filename}` })
})
