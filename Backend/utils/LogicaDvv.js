const crypto = require('crypto');
const AuditoriaDvv = require('../models/AuditoriaDvv');
const {calcularDVV} = require('./CalculosDv')

/**
 * @param {Object} Model 
 * @param {string} nombreTabla 
 * @param {string} pkField 
 */
const actualizarDVV = async (Model, nombreTabla, pkField = 'id_user') => {
    try {
        const registros = await Model.findAll({
            attributes: ['dvh'],
            order: [[pkField, 'ASC']]
        });

        const Dvhs = registros.map(r => r.dvh);

        const generarDvv = calcularDVV(Dvhs)

        await AuditoriaDvv.upsert({
            tabla_afectada: nombreTabla,
            dvv: generarDvv,
            ultima_actualizacion: new Date()
        });

        return generarDvv;
    } catch (error) { 
        console.error(`Error al actualizar DVV para la tabla ${nombreTabla}:`, error);
        throw error;
    }
};

/**
 * @param {Object} Model 
 * @param {string} nombreTabla 
 * @param {string} pkField - Campo de la clave primaria
 */
const verificarDVVTabla = async (Model, nombreTabla, pkField = 'id_user') => {
    try {
        const auditoriaRegistro = await AuditoriaDvv.findOne({
            where: { tabla_afectada: nombreTabla }
        });

        if (!auditoriaRegistro) {
            return await actualizarDVV(Model, nombreTabla, pkField);
        }

        const registros = await Model.findAll({
            attributes: ['dvh'],
            order: [[pkField, 'ASC']]
        });
        const Dvhs = registros.map(r => r.dvh);
        const dvvActual = calcularDVV(Dvhs);

        if (dvvActual !== auditoriaRegistro.dvv) {
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