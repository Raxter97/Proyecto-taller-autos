const express = require('express');
const router = express.Router();
const { consultarBitacora } = require('../controllers/BitacoraController');
const { verificarToken } = require('../middlewares/AuthMiddleware');
const { verificarPermiso } = require('../middlewares/RBACMiddleware');

router.use(verificarToken);

router.get('/', verificarPermiso('SEGURIDAD_CRUD'), consultarBitacora);

module.exports = router;