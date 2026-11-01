const express = require('express');
const router = express.Router();
const { obtenerFacturas, generarFactura, registrarPago, obtenerFacturasPorCliente, obtenerFacturasPorAuto} = require('../controllers/FacturaController');
const { verificarToken } = require('../middlewares/AuthMiddleware');
const { verificarPermiso } = require('../middlewares/RBACMiddleware');

router.use(verificarToken);

router.get('/', verificarPermiso('FACTURACION_COBRANZAS_CRUD'), obtenerFacturas);
router.get('/auto/:id_auto', verificarPermiso('FACTURACION_COBRANZAS_CRUD'), obtenerFacturasPorAuto);
router.get('/cliente/:id_cliente', verificarPermiso('FACTURACION_COBRANZAS_CRUD'), obtenerFacturasPorCliente);

router.post('/', verificarPermiso('FACTURACION_COBRANZAS_CRUD'), generarFactura);

router.put('/:id_factura/pagar', verificarPermiso('FACTURACION_COBRANZAS_CRUD'), registrarPago);

module.exports = router;