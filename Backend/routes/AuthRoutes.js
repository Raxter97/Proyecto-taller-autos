const express = require('express');
const router = express.Router();
const { 
    login, 
    registro, 
    obtenerPerfil, 
    actualizarEmail, 
    actualizarPassword, 
    recuperarPassword, 
    userEliminarCuenta 
} = require('../controllers/AuthController');
const { verificarToken } = require('../middlewares/AuthMiddleware');

router.post('/login', login);
router.post('/registro', registro);
router.post('/recuperar-password', recuperarPassword);

router.use(verificarToken);

router.get('/me', obtenerPerfil);
router.put('/me/email', actualizarEmail);
router.put('/me/password', actualizarPassword);       
router.delete('/me/cuenta', userEliminarCuenta);    

module.exports = router;