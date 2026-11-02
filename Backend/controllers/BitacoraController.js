const Bitacora = require('../models/Bitacora');
const { Op } = require('sequelize');
const { verificarDVVTabla } = require('../utils/LogicaDvv');

const consultarBitacora = async (req, res) => {
    try {
        const { fechaInicio, fechaFin, id_user, nivel_impacto, accion } = req.query;
        
        try {
            await verificarDVVTabla(Bitacora, 'bitacora', 'id_bitacora');
        } catch (integrityError) {
            return res.status(403).json({ 
                mensaje: '[CRÍTICO] Alerta de seguridad: Discrepancia de integridad DVV detectada en la bitácora. Posible manipulación externa.',
                error: integrityError.message 
            });
        }

        const where = {};
        if (fechaInicio && fechaFin) {
            where.fecha_hora = { 
                [Op.between]: [new Date(fechaInicio), 
                new Date(fechaFin)] 
            };
        }
        if (id_user){
            where.id_user = id_user;
        } 
        if (nivel_impacto){
            where.nivel_impacto = nivel_impacto;
        } 
        if (accion){
            where.accion = { [Op.like]: `%${accion}%` };
        } 
        const logs = await Bitacora.findAll({
            where,
            order: [['fecha_hora', 'DESC']],
            limit: 100
        });

        res.status(200).json({ logs });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al consultar logs de auditoría', error: error.message });
    }
};

module.exports = { consultarBitacora };