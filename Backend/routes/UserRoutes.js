const express = require('express');
const router = express.Router();
const { 
  registrarCuentaAdmin, 
  modificarCuentaAdmin, 
  desactivarCuentaAdmin, 
  activarCuentaAdmin,         
  actualizarRolesPorEmail,    
  listarUsuarios 
} = require('../controllers/UserController');
const { verificarToken } = require('../middlewares/AuthMiddleware');
const { verificarPermiso } = require('../middlewares/RBACMiddleware');

router.use(verificarToken);

router.get('/', verificarPermiso('SEGURIDAD_CRUD'), listarUsuarios);
router.post('/', verificarPermiso('SEGURIDAD_CRUD'), registrarCuentaAdmin);


router.put('/roles', verificarPermiso('SEGURIDAD_CRUD'), actualizarRolesPorEmail);
router.put('/:id/activar', verificarPermiso('SEGURIDAD_CRUD'), activarCuentaAdmin);

router.put('/:id', verificarPermiso('SEGURIDAD_CRUD'), modificarCuentaAdmin);
router.delete('/:id', verificarPermiso('SEGURIDAD_CRUD'), desactivarCuentaAdmin);

module.exports = router;