const express = require('express');
const router = express.Router();
const { crearCliente, modificarCliente } = require('../controllers/ClienteController');
const { verificarToken } = require('../middlewares/AuthMiddleware'); 

router.use(verificarToken);

router.post('/', crearCliente);      
router.put('/:id', modificarCliente); 

module.exports = router;