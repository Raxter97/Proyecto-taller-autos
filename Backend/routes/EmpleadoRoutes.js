const express = require('express');
const router = express.Router();
const { obtenerEmpleados, crearEmpleado, modificarEmpleado, desactivarEmpleado } = require('../controllers/EmpleadoController');
const { verificarToken } = require('../middlewares/AuthMiddleware'); 
const { verificarPermiso } = require('../middlewares/RBACMiddleware');

router.use(verificarToken);

router.get('/', verificarPermiso('PERSONAL_EMPLEADOS_CRUD'), obtenerEmpleados);

router.post('/', verificarPermiso('PERSONAL_EMPLEADOS_CRUD'), crearEmpleado);
router.put('/:id', verificarPermiso('PERSONAL_EMPLEADOS_CRUD'), modificarEmpleado);
router.delete('/:id', verificarPermiso('PERSONAL_EMPLEADOS_CRUD'), desactivarEmpleado);

module.exports = router;