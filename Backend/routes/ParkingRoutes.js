const express = require('express');
const router = express.Router();
const { consultarParking, registrarIngreso, registrarSalida } = require('../controllers/ParkingController');
const { verificarToken } = require('../middlewares/AuthMiddleware');
const { verificarPermiso } = require('../middlewares/RBACMiddleware');

router.use(verificarToken);

router.get('/', verificarPermiso('PARKING_LECTURA'), consultarParking);
router.post('/ingreso', verificarPermiso('PARKING_CRUD'), registrarIngreso);
router.put('/salida/:nro_lugar', verificarPermiso('PARKING_CRUD'), registrarSalida);

module.exports = router;