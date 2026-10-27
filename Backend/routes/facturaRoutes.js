const express = require('express');
const router = express.Router();
const { obtenerFacturas, generarFactura, registrarPago } = require('../controllers/FacturaController');
const { verificarToken } = require('../middlewares/AuthMiddleware');
const { verificarPermiso } = require('../middlewares/RBACMiddleware');

router.use(verificarToken);

router.get('/', verificarPermiso('FACTURACION_COBRANZAS_CRUD'), obtenerFacturas);
router.get('/:id', verificarPermiso('FACTURACION_COBRANZAS_CRUD'), obtenerFacturaPorId);

router.post('/', verificarPermiso('FACTURACION_COBRANZAS_CRUD'), generarFactura);

router.put('/:id_factura/pagar', verificarPermiso('FACTURACION_COBRANZAS_CRUD'), registrarPago);

module.exports = router;