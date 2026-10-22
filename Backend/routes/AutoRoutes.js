const express = require('express');
const router = express.Router();
const { crearAuto, modificarAuto, consultarHistorial } = require('../controllers/AutoController');
const { verificarToken } = require('../middlewares/AuthMiddleware');

// gomez

router.use(verificarToken);

router.post('/', crearAuto);
router.put('/:id', modificarAuto);
router.get('/historial/:patente', consultarHistorial);

module.exports = router;