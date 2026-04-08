import { Router } from 'express';
import multer from 'multer';
import { DocumentController } from '../controllers/DocumentController';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

export function createDocumentRoutes(controller: DocumentController): Router {
  const router = Router();

  router.post('/upload', upload.single('file'), (req, res, next) => controller.upload(req, res, next));
  router.get('/', (req, res, next) => controller.listDocuments(req, res, next));

  return router;
}
