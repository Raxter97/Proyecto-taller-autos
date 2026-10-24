const express = require('express');
const router = express.Router();
const { crearAuto, modificarAuto, consultarHistorial } = require('../controllers/AutoController');
const { verificarToken } = require('../middlewares/AuthMiddleware');
const { verificarPermiso } = require('../middlewares/RBACMiddleware');

router.use(verificarToken);

router.post('/', verificarPermiso('CLIENTES_VEHICULOS_CRUD'), crearAuto);
router.put('/:id', verificarPermiso('CLIENTES_VEHICULOS_CRUD'), modificarAuto);
router.get('/historial/:patente', verificarPermiso('CLIENTES_VEHICULOS_LECTURA'), consultarHistorial);

module.exports = router;