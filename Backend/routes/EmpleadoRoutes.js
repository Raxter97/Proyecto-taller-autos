
const express = require('express');
const router = express.Router();
const { crearEmpleado, modificarEmpleado,desactivarEmpleado } = require('../controllers/EmpleadoController');
const { verificarToken } = require('../middlewares/AuthMiddleware'); 

router.use(verificarToken);


router.post('/', verificarPermiso('PERSONAL_EMPLEADOS_CRUD'), crearEmpleado);
router.put('/:id', verificarPermiso('PERSONAL_EMPLEADOS_CRUD'), modificarEmpleado);
router.delete('/:id', verificarPermiso('PERSONAL_EMPLEADOS_CRUD'), desactivarEmpleado);


module.exports = router;