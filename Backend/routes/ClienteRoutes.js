const express = require('express');
const router = express.Router();
const { obtenerClientes, crearCliente, modificarCliente, desactivarCliente } = require('../controllers/ClienteController');
const { verificarToken } = require('../middlewares/AuthMiddleware'); 
const { verificarPermiso } = require('../middlewares/RBACMiddleware');

router.use(verificarToken);

router.get('/', verificarPermiso('CLIENTES_VEHICULOS_CRUD'), obtenerClientes);

router.post('/', verificarPermiso('CLIENTES_VEHICULOS_CRUD'), crearCliente);      
router.put('/:id', verificarPermiso('CLIENTES_VEHICULOS_CRUD'), modificarCliente); 
router.delete('/:id', verificarPermiso('CLIENTES_VEHICULOS_CRUD'), desactivarCliente);

module.exports = router;