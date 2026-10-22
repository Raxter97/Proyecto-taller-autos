// routes/empleadoRoutes.js
const express = require('express');
const router = express.Router();
const { crearEmpleado, modificarEmpleado } = require('../controllers/EmpleadoController');
const { verificarToken } = require('../middlewares/AuthMiddleware'); 

router.use(verificarToken);

router.post('/', crearEmpleado);
router.put('/:id', modificarEmpleado);

module.exports = router;