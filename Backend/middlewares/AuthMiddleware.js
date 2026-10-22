const jwt = require('jsonwebtoken');

const verificarToken = (req,res, next)=>{
    const authHeader = req.headers['authorization']; 
    if (!authHeader) {
        return res.status(401).json({ mensaje: 'Acceso no autorizado' });
    };
    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ mensaje: 'Token no proporcionado.' });
    };
    const token = authHeader.split(' ')[1];
        if(!token){
            return res.status(401).json({mensaje: "Acceso denegado"})
        };
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto');
        req.user = decoded
        next();

    }catch(error){
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ mensaje: 'La sesión ha expirado. Por favor, vuelva a iniciar sesión.' });
        }
        return res.status(403).json({mensaje:"Token inválido o corrupto."});
    }
};

module.exports= {verificarToken};