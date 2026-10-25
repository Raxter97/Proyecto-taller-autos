const express = require('express');
const router = express.Router();
const { obtenerRepuestos, crearRepuesto, actualizarRepuesto, bajaRepuesto, obtenerProveedores, crearProveedor, actualizarProveedor, bajaProveedor,registrarOrdenCompra,confirmarRecepcionMercaderia} = require('../controllers/InventarioController');
const { verificarToken } = require('../middlewares/AuthMiddleware');
const { verificarPermiso } = require('../middlewares/RBACMiddleware');

router.use(verificarToken);

router.get('/repuestos', verificarPermiso('INVENTARIO_COMPRAS_CRUD'),obtenerRepuestos);
router.post('/repuestos', verificarPermiso('INVENTARIO_COMPRAS_CRUD'), crearRepuesto);
router.put('/repuestos/:id', verificarPermiso('INVENTARIO_COMPRAS_CRUD'), actualizarRepuesto);
router.delete('/repuestos/:id', verificarPermiso('INVENTARIO_COMPRAS_CRUD'), bajaRepuesto);

router.get('/proveedores', verificarPermiso('INVENTARIO_COMPRAS_CRUD'),obtenerProveedores);
router.post('/proveedores', verificarPermiso('INVENTARIO_COMPRAS_CRUD'), crearProveedor);
router.put('/proveedores/:id', verificarPermiso('INVENTARIO_COMPRAS_CRUD'), actualizarProveedor);
router.delete('/proveedores/:id', verificarPermiso('INVENTARIO_COMPRAS_CRUD'), bajaProveedor);

router.post('/compras', verificarPermiso('INVENTARIO_COMPRAS_CRUD'), registrarOrdenCompra);
router.put('/compras/:id_compra/recibir', verificarPermiso('INVENTARIO_COMPRAS_CRUD'), confirmarRecepcionMercaderia);

module.exports = router;