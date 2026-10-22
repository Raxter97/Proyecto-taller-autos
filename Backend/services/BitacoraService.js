const Bitacora = require('../models/Bitacora'); 
const { calcularDVH } = require('../utils/CalculosDv');
const { actualizarDVV } = require('../utils/LogicaDvv');

/**
 * @param {Object} params - Parámetros del evento
 * @param {string} params.accion - Tipo de operación (ej. 'LOGIN_EXITOSO', 'INSERT_USUARIO')
 * @param {string|Object} params.descripcion - Detalle o JSON con estado previo y posterior
 * @param {string} params.nivel_impacto - 'Baja', 'Media', 'Alta' o 'Critica'
 * @param {number} params.id_usuario - ID de la cuenta que ejecuta la acción
 */

const registrarBitacora = async ({ accion, descripcion, nivel_impacto, id_usuario }) => {
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
        });
        await actualizarDVV(Bitacora, 'bitacora', 'id_bitacora');

        return nuevoLog;
    } catch (error) {
        console.error('[CRÍTICO] Error al registrar en la bitácora:', error);

    }
};

module.exports = { registrarBitacora };