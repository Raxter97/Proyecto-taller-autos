const express = require('express');
const router = express.Router();
const { consultarParking, registrarIngreso, registrarSalida } = require('../controllers/ParkingController');
const { verificarToken } = require('../middlewares/AuthMiddleware');

router.use(verificarToken);

router.get('/', consultarParking);
router.post('/ingreso', registrarIngreso);
router.put('/salida/:nro_lugar', registrarSalida);

module.exports = router;