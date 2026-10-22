const { verificarToken } = require('../middlewares/authMiddleware'); 

router.use(verificarToken);