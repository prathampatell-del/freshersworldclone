import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
export const RESUMES_DIR = path.join(UPLOADS_DIR, 'resumes');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDir(RESUMES_DIR);

const ALLOWED_RESUME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureDir(RESUMES_DIR);
    cb(null, RESUMES_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const userId = (req as { user?: { id: number } }).user?.id ?? 'anon';
    const stamp = crypto.randomBytes(6).toString('hex');
    cb(null, `${userId}-${Date.now()}-${stamp}${ext}`);
  },
});

export const resumeUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_RESUME_TYPES.has(file.mimetype)) {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
      return;
    }
    cb(null, true);
  },
});

export function publicUrlForFile(filename: string): string {
  return `/uploads/resumes/${filename}`;
}

export function removeUploadByUrl(url: string | null | undefined) {
  if (!url || !url.startsWith('/uploads/resumes/')) return;
  const filename = path.basename(url);
  const abs = path.join(RESUMES_DIR, filename);
  // Make sure the resolved path is still inside the resumes directory.
  if (!abs.startsWith(RESUMES_DIR + path.sep)) return;
  fs.promises.unlink(abs).catch(() => { /* best effort */ });
}
