const Bitacora = require('../models/Bitacora'); 
const { calcularDVH } = require('../utils/CalculosDv');
const  {actualizarDVV} = require('../utils/LogicaDvv');

/**
 * @param {Object} params 
 * @param {string} params.accion - Tipo de operación 
 * @param {string|Object} params.descripcion - Detalle o JSON con estado previo y posterior
 * @param {string} params.nivel_impacto 
 * @param {number} params.id_usuario - ID de la cuenta 
 */

const registrarBitacora = async ({ accion, descripcion, nivel_impacto, id_usuario }, options = {}) => {
    try {
        const fecha_hora = new Date();
        const descripcionJson = typeof descripcion === 'object' ? JSON.stringify(descripcion) : descripcion;

        const datosDVH = {
            accion,
            descripcion: descripcionJson,
            fecha_hora: fecha_hora.toISOString(),
            id_usuario,
            nivel_impacto
        };
        
        const dvh = calcularDVH(datosDVH);

        const nuevoLog = await Bitacora.create({
            fecha_hora,
            accion,
            descripcion: descripcionJson,
            nivel_impacto,
            dvh,
            id_usuario
        }, options);

        await actualizarDVV(Bitacora, 'bitacora', 'id_bitacora', options);

        return nuevoLog;
    } catch (error) {
        console.error('[CRÍTICO] Error al registrar en la bitácora:', error);
    }
};

module.exports = { registrarBitacora };