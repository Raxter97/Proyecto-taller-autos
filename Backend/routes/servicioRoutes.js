const express = require('express');
const router = express.Router();
const { 
    obtenerServicios, 
    crearServicio, 
    modificarServicio 
} = require('../controllers/ServicioController');
const { verificarToken } = require('../middlewares/AuthMiddleware');
const { verificarPermiso } = require('../middlewares/rbacMiddleware');

router.use(verificarToken);

router.get('/', obtenerServicios);
router.post('/', verificarPermiso('TALLER_REPARACIONES_CRUD'), crearServicio);
router.put('/:id', verificarPermiso('TALLER_REPARACIONES_CRUD'), modificarServicio);

module.exports = router;