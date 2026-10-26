const Parking = require('../models/Parking');
const Auto = require('../models/Auto');
const Informe = require('../models/Informe');
const Factura = require('../models/Factura');
const { registrarBitacora } = require('../services/BitacoraService');
const { calcularDVH } = require('../utils/CalculosDv');
const { actualizarDVV } = require('../utils/LogicaDvv');
const sequelize = require('../config/Database');

const consultarParking = async (req, res) => {
    try {
        let { page = 1, limit = 50 } = req.query;
        page = Math.max(1, parseInt(page, 10) || 1);
        limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
        const offset = (page - 1) * limit;

        const plazas = await Parking.findAll({
            limit,
            offset,
            include: [{ model: Auto, required: false }],
            order: [['nro_lugar', 'ASC']]
        });
        
        res.status(200).json({ plazas });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

const registrarIngreso = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const { nro_lugar, patente } = req.body;
        if (!nro_lugar || !patente) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Número de parking y patente requeridos.' });
        }

        const auto = await Auto.findOne({ 
            where: { patente },
            transaction: trans
        });
        if (!auto) {
            await trans.rollback();
            return res.status(404).json({ mensaje: 'Vehículo no encontrado.' });
        }

        const plaza = await Parking.findOne({ 
            where: { nro_lugar },
            transaction: trans
        });
        if (!plaza) {
            await trans.rollback();
            return res.status(404).json({ mensaje: 'Plaza de parking no encontrada.' });
        }

        if (plaza.estado) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'La plaza de parking ya se encuentra ocupada.' });
        }

        plaza.estado = true;
        plaza.id_auto = auto.id_auto;

        const datosDVH = {
            estado: true,
            id_auto: Number(auto.id_auto),
            nro_lugar: Number(nro_lugar)
        };
        plaza.dvh = calcularDVH(datosDVH);
        await plaza.save({ transaction: trans });

        await actualizarDVV(Parking, 'parking', 'nro_lugar', { transaction: trans });

        await registrarBitacora({
            accion: 'INGRESO_PARKING',
            descripcion: JSON.stringify({ nro_lugar, id_auto: auto.id_auto, patente }),
            nivel_impacto: 'Media',
            id_usuario: req.user.id_user
        }, { transaction: trans });

        await trans.commit();
        res.status(200).json({ mensaje: 'Vehículo ingresado exitosamente a la plaza: ', plaza });
    } catch (error) {
        await trans.rollback();
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

const registrarSalida = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const { nro_lugar } = req.params;

        const plaza = await Parking.findOne({ 
            where: { nro_lugar },
            transaction: trans
        });
        
        if (!plaza) {
            await trans.rollback();
            return res.status(404).json({ mensaje: 'Plaza de parking no encontrada.' });
        }

        if (!plaza.estado) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'La plaza ya se encuentra libre.' });
        }

        const informe = await Informe.findOne({ 
            where: { id_auto: plaza.id_auto }, 
            order: [['id_informe', 'DESC']],
            transaction: trans
        });
        
        if (informe) {
            const factura = await Factura.findOne({ 
                where: { id_informe: informe.id_informe },
                transaction: trans
            });
            
            if (!factura || factura.estado !== 'pagada') {
                await trans.rollback();
                return res.status(400).json({ 
                    mensaje: 'No se puede registrar la salida del vehículo. La factura asociada se encuentra pendiente de pago.' 
                });
            }
        }

        const autoIdPrevio = plaza.id_auto;
        plaza.estado = false;
        plaza.id_auto = null;

        const datosDVH = {
            estado: false,
            id_auto: null,
            nro_lugar: Number(nro_lugar)
        };
        plaza.dvh = calcularDVH(datosDVH);
        await plaza.save({ transaction: trans });

        await actualizarDVV(Parking, 'parking', 'nro_lugar', { transaction: trans });
        
        await registrarBitacora({
            accion: 'SALIDA_PARKING',
            descripcion: JSON.stringify({ nro_lugar, id_auto_previo: autoIdPrevio }),
            nivel_impacto: 'Media',
            id_usuario: req.user.id_user
        }, { transaction: trans });

        await trans.commit();
        res.status(200).json({ mensaje: 'Plaza liberada correctamente' });
    } catch (error) {
        await trans.rollback();
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

module.exports = { consultarParking, registrarIngreso, registrarSalida };