const jwt = require('jsonwebtoken');
const { verificarDVVTabla } = require('../utils/LogicaDvv');
const User = require('../models/User.models');
const { registrarBitacora } = require('../services/BitacoraService');

const verificarToken = async (req,res, next)=>{
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
        
        try {
            await verificarDVVTabla(User, 'users', 'id_user');
        }catch (dvvError) {
            await registrarBitacora({
                accion: 'ERROR_INTEGRIDAD_DVV_CRITICO',
                descripcion: JSON.stringify({ error: dvvError.message, tabla: 'users' }),
                nivel_impacto: 'Crítica',
                id_usuario: decoded.id_user || 1
            });
            return res.status(403).json({ mensaje: '[CRÍTICO] Alteración de datos detectada en el sistema. Sesión invalidada.' 
            });
        }

        next();

    }catch(error){
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ mensaje: 'La sesión ha expirado. Por favor, vuelva a iniciar sesión.' });
        }
        return res.status(403).json({mensaje:"Token inválido o corrupto."});
    }
};

module.exports= {verificarToken};