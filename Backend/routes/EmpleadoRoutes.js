const express = require('express');
const router = express.Router();
const { obtenerEmpleados, crearEmpleado, modificarEmpleado, desactivarEmpleado } = require('../controllers/EmpleadoController');
const { verificarToken } = require('../middlewares/AuthMiddleware'); 
const { verificarPermiso } = require('../middlewares/RBACMiddleware');

router.use(verificarToken);

// Rutas de Lectura (GET)
router.get('/', verificarPermiso('PERSONAL_EMPLEADOS_CRUD'), obtenerEmpleados);

// Rutas de Escritura y Modificación
router.post('/', verificarPermiso('PERSONAL_EMPLEADOS_CRUD'), crearEmpleado);
router.put('/:id', verificarPermiso('PERSONAL_EMPLEADOS_CRUD'), modificarEmpleado);
router.delete('/:id', verificarPermiso('PERSONAL_EMPLEADOS_CRUD'), desactivarEmpleado);

module.exports = router;