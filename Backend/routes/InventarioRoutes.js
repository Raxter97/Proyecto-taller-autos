const express = require('express');
const router = express.Router();
const {obtenerRepuestos,crearRepuesto,actualizarRepuesto,bajaRepuesto,obtenerProveedores,crearProveedor,bajaProveedor} = require('../controllers/InventarioController');
const { verificarToken } = require('../middlewares/AuthMiddleware');

router.use(verificarToken);


router.get('/repuestos', obtenerRepuestos);
router.post('/repuestos', verificarPermiso('INVENTARIO_COMPRAS_CRUD'), crearRepuesto);
router.put('/repuestos/:id', verificarPermiso('INVENTARIO_COMPRAS_CRUD'), actualizarRepuesto);
router.delete('/repuestos/:id', verificarPermiso('INVENTARIO_COMPRAS_CRUD'), bajaRepuesto);



router.get('/proveedores', obtenerProveedores);
router.post('/proveedores', crearProveedor);
router.delete('/proveedores/:id', bajaProveedor);

module.exports = router;