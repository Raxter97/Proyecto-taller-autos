const express = require('express');
const router = express.Router();
const { obtenerClientes, obtenerClientePorId, crearCliente, modificarCliente, desactivarCliente } = require('../controllers/ClienteController');
const { verificarToken } = require('../middlewares/AuthMiddleware'); 
const { verificarPermiso } = require('../middlewares/RBACMiddleware');

router.use(verificarToken);

// Rutas de Lectura (GET) protegidas por RBAC
router.get('/', verificarPermiso('CLIENTES_VEHICULOS_CRUD'), obtenerClientes);
router.get('/:id', verificarPermiso('CLIENTES_VEHICULOS_CRUD'), obtenerClientePorId);

// Rutas de Escritura y Baja Lógica
router.post('/', verificarPermiso('CLIENTES_VEHICULOS_CRUD'), crearCliente);      
router.put('/:id', verificarPermiso('CLIENTES_VEHICULOS_CRUD'), modificarCliente); 
router.delete('/:id', verificarPermiso('CLIENTES_VEHICULOS_CRUD'), desactivarCliente);

module.exports = router;