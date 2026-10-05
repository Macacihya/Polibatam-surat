import multer from "multer";
import path from "path";

const FILE_SIZE = 50 * 1024 * 1024; // 50MB

const storageFile: multer.StorageEngine = multer.diskStorage({
  destination: "public/",
  filename: (_req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

export const UploadDocument = multer({
  storage: storageFile,
  limits: {
    fileSize: FILE_SIZE,
  },
});
