const express = require('express');
const router = express.Router();
const { consultarTurnos, agendarTurno, reprogramarTurno, cancelarTurno,consultarTurnosUser } = require('../controllers/TurnoController');
const { verificarToken } = require('../middlewares/AuthMiddleware');
const { verificarPermiso } = require('../middlewares/RBACMiddleware');

router.use(verificarToken);

router.get('/', verificarPermiso('AGENDA_TURNOS_LECTURA'), consultarTurnos);
router.get('/mis-turnos', verificarPermiso('AGENDA_TURNOS_LECTURA'), consultarTurnosUser);
router.post('/', verificarPermiso('AGENDA_TURNOS_CRUD'), agendarTurno);
router.put('/:id', verificarPermiso('AGENDA_TURNOS_CRUD'), reprogramarTurno);
router.put('/:id/cancelar', verificarPermiso('AGENDA_TURNOS_CRUD'), cancelarTurno);



module.exports = router;