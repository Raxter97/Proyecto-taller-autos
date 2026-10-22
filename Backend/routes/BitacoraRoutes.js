//aplicarlo en todos los routes, aplica el middleware a todas los routes
const { verificarToken } = require('../middlewares/AuthMiddleware'); 

router.use(verificarToken);

