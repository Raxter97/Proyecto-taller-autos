const express = require('express');
const router = express.Router();
const { crearAuto, modificarAuto, consultarHistorial,consultarHistorialUser } = require('../controllers/AutoController');
const { verificarToken } = require('../middlewares/AuthMiddleware');
const { verificarPermiso } = require('../middlewares/RBACMiddleware');

router.use(verificarToken);

router.post('/', verificarPermiso('CLIENTES_VEHICULOS_CRUD'), crearAuto);
router.get('/mis-autos', verificarPermiso('CLIENTES_VEHICULOS_CRUD'), consultarHistorialUser);
router.put('/:id', verificarPermiso('CLIENTES_VEHICULOS_CRUD'), modificarAuto);
router.get('/historial/:patente', verificarPermiso('CLIENTES_VEHICULOS_LECTURA'), consultarHistorial);

module.exports = router;