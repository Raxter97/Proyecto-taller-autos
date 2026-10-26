const express = require('express');
const router = express.Router();
const { obtenerFacturas, obtenerFacturaPorId, generarFactura, registrarPago } = require('../controllers/FacturaController');
const { verificarToken } = require('../middlewares/AuthMiddleware');
const { verificarPermiso } = require('../middlewares/RBACMiddleware');

router.use(verificarToken);

// Rutas de Lectura y Consulta de Facturas
router.get('/', verificarPermiso('FACTURACION_COBRANZAS_CRUD'), obtenerFacturas);
router.get('/:id', verificarPermiso('FACTURACION_COBRANZAS_CRUD'), obtenerFacturaPorId);

// CU-FAC-01: Generar factura consolidando el informe técnico finalizado
router.post('/', verificarPermiso('FACTURACION_COBRANZAS_CRUD'), generarFactura);

// CU-FAC-02: Registrar pago inmediato y liberar parking automáticamente
router.put('/:id_factura/pagar', verificarPermiso('FACTURACION_COBRANZAS_CRUD'), registrarPago);

module.exports = router;