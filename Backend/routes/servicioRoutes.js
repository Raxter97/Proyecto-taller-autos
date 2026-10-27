const express = require('express');
const router = express.Router();
const { 
    obtenerServicios, 
    crearServicio, 
    modificarServicio,
    desactivarServicio
} = require('../controllers/ServicioController');
const { verificarToken } = require('../middlewares/AuthMiddleware');
const { verificarPermiso } = require('../middlewares/RBACMiddleware');

router.use(verificarToken);

// Rutas de Lectura de Servicios
router.get('/', verificarPermiso('TALLER_REPARACIONES_CRUD'), obtenerServicios);
// router.get('/:id', verificarPermiso('TALLER_REPARACIONES_CRUD'), obtenerServicioPorId); talvez

// Rutas de Gestión de Catálogo de Servicios
router.post('/', verificarPermiso('TALLER_REPARACIONES_CRUD'), crearServicio);
router.put('/:id', verificarPermiso('TALLER_REPARACIONES_CRUD'), modificarServicio);
router.delete('/:id', verificarPermiso('TALLER_REPARACIONES_CRUD'), desactivarServicio);

module.exports = router;