const Servicio = require('../models/Servicio');
const { calcularDVH } = require('../utils/CalculosDv');
const { actualizarDVV } = require('../utils/LogicaDvv');
const { registrarBitacora } = require('../services/BitacoraService');
const obtenerServicios = async (req, res) => {
    try {
        const servicios = await Servicio.findAll();
        res.status(200).json({ servicios });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener servicios', error: error.message });
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
            id_usuario: req.user?.id_user || 1
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
            id_usuario: req.user?.id_user || 1
        });

        res.status(200).json({ mensaje: 'Servicio actualizado correctamente'});
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar servicio', error: error.message });
    }
};

module.exports = { obtenerServicios, crearServicio, modificarServicio };