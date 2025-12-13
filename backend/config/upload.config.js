/**
 * Upload Configuration - Multer Setup
 * 
 * Configuração centralizada para upload de arquivos
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Diretório de uploads
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Garantir que o diretório existe
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log('📁 Created uploads directory:', UPLOADS_DIR);
}

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Gerar nome único com timestamp e extensão original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

// Tipos de arquivo permitidos
const ALLOWED_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

// Limite de tamanho (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Filtro de arquivos
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`), false);
  }
};

// Middleware de upload configurado
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter
});

// Error handler para erros do Multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Arquivo muito grande',
        message: 'O arquivo deve ter no máximo 10MB'
      });
    }
    return res.status(400).json({
      error: 'Erro no upload',
      message: err.message
    });
  }
  next(err);
};

module.exports = {
  upload,
  handleMulterError,
  UPLOADS_DIR,
  ALLOWED_MIMES,
  MAX_FILE_SIZE
};

