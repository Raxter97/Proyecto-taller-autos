const { login, registro, obtenerPerfil, actualizarEmail, actualizarPassword, recuperarPassword, userEliminarCuenta 
} = require('../controllers/AuthController');

router.post('/login', login);
router.post('/registro', registro);
router.post('/recuperar-password', recuperarPassword); // Nueva ruta pública de recuperación

router.use(verificarToken);

router.get('/me', obtenerPerfil);
router.put('/me/email', actualizarEmail);
router.put('/me/password', actualizarPassword);       
router.delete('/me/cuenta', userEliminarCuenta);    