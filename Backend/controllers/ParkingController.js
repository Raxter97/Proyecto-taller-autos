const Parking = require('../models/Parking');
const Auto = require('../models/Auto');
const Informe = require('../models/Informe');
const Factura = require('../models/Factura');
const { registrarBitacora } = require('../services/BitacoraService');

const consultarParking = async (req, res) => {
    try {
        const plazas = await Parking.findAll({
            include: [{ model: Auto, required: false }],
            order: [['nro_lugar', 'ASC']]
        });
        res.status(200).json({ plazas });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

const registrarIngreso = async (req, res) => {
    try {
        const { nro_lugar, patente } = req.body;
        if (!nro_lugar || !patente) {
            return res.status(400).json({ mensaje: 'Número de parking y patente requeridos.' });
        }

        const auto = await Auto.findOne({ 
            where: { patente } 
        });
        if (!auto) {
            return res.status(404).json({ mensaje: 'Vehículo no encontrado.' });
        }

        const plaza = await Parking.findOne({ 
            where: { nro_lugar } 
        });
        if (!plaza) {
            return res.status(404).json({ mensaje: 'Plaza de parking no encontrada.' });
        }

        if (plaza.estado) {
            return res.status(400).json({ mensaje: 'La plaza de parking ya se encuentra ocupada.' });
        }

        plaza.estado = true;
        plaza.id_auto = auto.id_auto;
        await plaza.save();

        await registrarBitacora({
            accion: 'INGRESO_PARKING',
            descripcion: JSON.stringify({ nro_lugar, id_auto: auto.id_auto, patente }),
            nivel_impacto: 'Media',
            id_usuario: req.user?.id_user || 1
        });

        res.status(200).json({ mensaje: 'Vehículo ingresado exitosamente a la plaza: ', plaza });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

const registrarSalida = async (req, res) => {
    try {
        const { nro_lugar } = req.params;

        const plaza = await Parking.findOne({ 
            where: { nro_lugar } 
        });
        
        if (!plaza) {
            return res.status(404).json({ mensaje: 'Plaza de parking no encontrada.' });
        }

        if (!plaza.estado) {
            return res.status(400).json({ mensaje: 'La plaza ya se encuentra libre.' });
        }

        const informe = await Informe.findOne({ 
            where: { id_auto: plaza.id_auto }, 
            order: [['id_informe', 'DESC']] 
        });
        
        if (informe) {
            const factura = await Factura.findOne({ 
                where: { id_informe: informe.id_informe } 
            });
            
            if (!factura || factura.estado !== 'pagada') {
                return res.status(400).json({ 
                    mensaje: 'No se puede registrar la salida del vehículo. La factura asociada se encuentra pendiente de pago.' 
                });
            }
        }

        const autoIdPrevio = plaza.id_auto;
        plaza.estado = false;
        plaza.id_auto = null;
        await plaza.save();

        
        await registrarBitacora({
            accion: 'SALIDA_PARKING',
            descripcion: JSON.stringify({ nro_lugar, id_auto_previo: autoIdPrevio }),
            nivel_impacto: 'Media',
            id_usuario: req.user?.id_user || 1
        });

        res.status(200).json({ mensaje: 'Plaza liberada correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

module.exports = { consultarParking, registrarIngreso, registrarSalida };