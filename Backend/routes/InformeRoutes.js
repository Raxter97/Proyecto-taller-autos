const express = require('express');
const router = express.Router();
const { crearInforme, imputarRepuesto, imputarServicio, finalizarInforme, obtenerInformes } = require('../controllers/InformeController');
const { verificarToken } = require('../middlewares/AuthMiddleware');
const { verificarPermiso } = require('../middlewares/RBACMiddleware');

router.use(verificarToken);

router.get('/', verificarPermiso('TALLER_REPARACIONES_CRUD'), obtenerInformes);
router.post('/', verificarPermiso('TALLER_REPARACIONES_CRUD'), crearInforme);
router.post('/:id_informe/repuestos', verificarPermiso('TALLER_REPARACIONES_CRUD'), imputarRepuesto);
router.post('/:id_informe/servicios', verificarPermiso('TALLER_REPARACIONES_CRUD'), imputarServicio);
router.put('/:id_informe/finalizar', verificarPermiso('TALLER_REPARACIONES_CRUD'), finalizarInforme);

module.exports = router;