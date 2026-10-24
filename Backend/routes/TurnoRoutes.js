const express = require('express');
const router = express.Router();
const { consultarTurnos, agendarTurno, reprogramarTurno, cancelarTurno } = require('../controllers/TurnoController');
const { verificarToken } = require('../middlewares/AuthMiddleware');

router.use(verificarToken);

router.get('/', consultarTurnos);
router.post('/', agendarTurno);
router.put('/:id', reprogramarTurno);
router.put('/:id/cancelar', cancelarTurno);

module.exports = router;