const express = require('express');
const router = express.Router();
const { generarFactura, registrarPago } = require('../controllers/FacturaController');
const { verificarToken } = require('../middlewares/AuthMiddleware');
const { verificarPermiso } = require('../middlewares/rbacMiddleware');

router.use(verificarToken);

// CU-FAC-01: Generar factura consolidando el informe técnico finalizado
router.post('/', verificarPermiso('FACTURACION_COBRANZAS_CRUD'), generarFactura);

// CU-FAC-02: Registrar pago inmediato (Efectivo/Transferencia/Tarjeta) y liberar parking automáticamente
router.put('/:id_factura/pagar', verificarPermiso('FACTURACION_COBRANZAS_CRUD'), registrarPago);

module.exports = router;