const crypto = require('crypto');
const AuditoriaDvv = require('../models/AuditoriaDvv');
const { calcularDVV } = require('./CalculosDv');
const { registrarBitacora } = require('../services/BitacoraService');

/**
 * @param {Object} Model 
 * @param {string} nombreTabla 
 * @param {string} pkField 
 */
const actualizarDVV = async (Model, nombreTabla, pkField = 'id_user', options = {}) => {
    try {
        const registros = await Model.findAll({
            attributes: ['dvh'],
            order: [[pkField, 'ASC']],
            ...options
        });

        const Dvhs = registros.map(r => r.dvh);
        const generarDvv = calcularDVV(Dvhs);

        await AuditoriaDvv.upsert({
            tabla_afectada: nombreTabla,
            dvv: generarDvv,
            ultima_actualizacion: new Date()
        }, options);

        return generarDvv;
    } catch (error) { 
        console.error(`Error al actualizar DVV para la tabla ${nombreTabla}:`, error);
        throw error;
    }
};

/**
 * @param {Object} Model 
 * @param {string} nombreTabla 
 * @param {string} pkField Campo de la clave primaria
 * @param {Object} req Objeto request (opcional para capturar el id del usuario si estuviera logueado)
 */
const verificarDVVTabla = async (Model, nombreTabla, pkField = 'id_user', req = null, options = {}) => {
    try {
        const auditoriaRegistro = await AuditoriaDvv.findOne({
            where: { tabla_afectada: nombreTabla },
            ...options
        });

        if (!auditoriaRegistro) {
            return await actualizarDVV(Model, nombreTabla, pkField, options);
        }

        const registros = await Model.findAll({
            attributes: ['dvh'],
            order: [[pkField, 'ASC']],
            ...options
        });
        const Dvhs = registros.map(r => r.dvh);
        const dvvActual = calcularDVV(Dvhs);

        if (dvvActual !== auditoriaRegistro.dvv) {
            // Registrar el evento crítico en  bitácora 
            try {
                await registrarBitacora({
                    accion: 'DISCREPANCIA_DVV_CRITICA',
                    descripcion: JSON.stringify({
                        tabla: nombreTabla,
                        mensaje: 'Manipulación externa de datos detectada mediante verificación DVV'
                    }),
                    nivel_impacto: 'Crítica',
                    id_usuario: req?.user?.id_user || null
                }, options);
            } catch (bitacoraError) {
                console.error('Error al registrar bitácora crítica de DVV:', bitacoraError);
            }

            throw new Error(`[CRÍTICO] Discrepancia de integridad DVV detectada en la tabla ${nombreTabla}. Posible manipulación externa de datos.`);
        }

        return true;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    actualizarDVV,
    verificarDVVTabla
};