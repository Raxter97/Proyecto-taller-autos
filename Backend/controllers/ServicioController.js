const Servicio = require('../models/Servicio');
const { calcularDVH } = require('../utils/CalculosDv');
const { actualizarDVV } = require('../utils/LogicaDvv');
const { registrarBitacora } = require('../services/BitacoraService');
const sequelize = require('../config/Database');

const obtenerServicios = async (req, res) => {
    try {
        let { page = 1, limit = 50 } = req.query;
        page = Math.max(1, parseInt(page, 10) || 1);
        limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
        
        const offset = (page - 1) * limit;

        const { count, rows: servicios } = await Servicio.findAndCountAll({
            limit,
            offset,
            order: [['id_servicio', 'ASC']]
        });

        res.status(200).json({
            totalRegistros: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            pageSize: servicios.length,
            servicios
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

const crearServicio = async (req, res) => {
    try {
        const { descripcion, precio } = req.body;
        if (!descripcion || precio === undefined) {
            return res.status(400).json({ mensaje: 'Descripción y precio son obligatorios.' });
        }

        const datosDVH = {
            descripcion,
            precio: Number(precio).toFixed(2),
            estado: true
        };
        const dvh = calcularDVH(datosDVH);

        const nuevoServicio = await Servicio.create({
            descripcion,
            precio,
            estado: true,
            dvh
        });
        await actualizarDVV(Servicio, 'servicios', 'id_servicio');

        await registrarBitacora({
            accion: 'INSERT_SERVICIO',
            descripcion: JSON.stringify({ servicio: nuevoServicio }),
            nivel_impacto: 'Baja',
            id_usuario: req.user.id_user
        });

        res.status(201).json({ mensaje: 'Servicio creado correctamente'});
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear servicio', error: error.message });
    }
};

const modificarServicio = async (req, res) => {
    try {
        const { id } = req.params;
        const { descripcion, precio, estado } = req.body;

        const servicio = await Servicio.findByPk(id);
        if (!servicio){
            return res.status(404).json({ mensaje: 'Servicio no encontrado.' });
        } 

        const previo = servicio.toJSON();
        if (descripcion !== undefined){
            servicio.descripcion = descripcion;
        } 
        if (precio !== undefined){
            servicio.precio = precio;
        } 
        if (estado !== undefined){
            servicio.estado = estado;
        } 

        const datosDVH = {
            descripcion: servicio.descripcion,
            precio: Number(servicio.precio).toFixed(2),
            estado: Boolean(servicio.estado)
        };
        servicio.dvh = calcularDVH(datosDVH);
        await servicio.save();

        await actualizarDVV(Servicio, 'servicios', 'id_servicio');

        await registrarBitacora({
            accion: 'UPDATE_SERVICIO',
            descripcion: JSON.stringify({ previo, posterior: servicio.toJSON() }),
            nivel_impacto: 'Baja',
            id_usuario: req.user.id_user
        });

        res.status(200).json({ mensaje: 'Servicio actualizado correctamente'});
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar servicio', error: error.message });
    }
};

const desactivarServicio = async (req, res) => {
    try {
        const { id } = req.params;
        const servicio = await Servicio.findByPk(id);
        if (!servicio) {
            return res.status(404).json({ mensaje: 'Servicio no encontrado.' });
        }

        const estadoPrevio = servicio.toJSON();
        servicio.estado = false; 

        const datosDVH = {
            descripcion: servicio.descripcion,
            precio: Number(servicio.precio).toFixed(2),
            estado: false
        };
        servicio.dvh = calcularDVH(datosDVH);
        await servicio.save();

        await actualizarDVV(Servicio, 'servicios', 'id_servicio');
        await registrarBitacora({
            accion: 'BAJA_LOGICA_SERVICIO',
            descripcion: JSON.stringify({ previo: estadoPrevio, posterior: servicio.toJSON() }),
            nivel_impacto: 'Alta',
            id_usuario: req.user.id_user
        });

        res.status(200).json({ mensaje: 'Servicio dado de baja lógica correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

module.exports = { obtenerServicios, crearServicio, modificarServicio,desactivarServicio };