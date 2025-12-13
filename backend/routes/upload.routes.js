/**
 * Upload Routes
 * 
 * Rotas para upload de arquivos
 */

const express = require('express');
const router = express.Router();
const { upload } = require('../config/upload.config');

/**
 * POST /api/upload
 * Upload de arquivo único
 */
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Nenhum arquivo enviado',
        message: 'É necessário enviar um arquivo no campo "file"'
      });
    }

    const fileInfo = {
      path: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    };

    res.status(201).json(fileInfo);
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({
      error: 'Erro no upload',
      message: error.message
    });
  }
});

module.exports = router;

