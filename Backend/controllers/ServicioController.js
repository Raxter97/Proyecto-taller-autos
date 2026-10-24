const { Servicio } = require('../models/DetallesInforme');
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

        const nuevoServicio = await Servicio.create({ descripcion, precio, estado: true });

        await registrarBitacora({
            accion: 'INSERT_SERVICIO',
            descripcion: JSON.stringify({ posterior: nuevoServicio }),
            nivel_impacto: 'Baja',
            id_usuario: req.user?.id_user || 1
        });

        res.status(201).json({ mensaje: 'Servicio creado correctamente', servicio: nuevoServicio });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear servicio', error: error.message });
    }
};

const modificarServicio = async (req, res) => {
    try {
        const { id } = req.params;
        const { descripcion, precio, estado } = req.body;

        const servicio = await Servicio.findByPk(id);
        if (!servicio) return res.status(404).json({ mensaje: 'Servicio no encontrado.' });

        const previo = servicio.toJSON();
        if (descripcion !== undefined) servicio.descripcion = descripcion;
        if (precio !== undefined) servicio.precio = precio;
        if (estado !== undefined) servicio.estado = estado;

        await servicio.save();

        await registrarBitacora({
            accion: 'UPDATE_SERVICIO',
            descripcion: JSON.stringify({ previo, posterior: servicio.toJSON() }),
            nivel_impacto: 'Baja',
            id_usuario: req.user?.id_user || 1
        });

        res.status(200).json({ mensaje: 'Servicio actualizado correctamente', servicio });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar servicio', error: error.message });
    }
};

module.exports = { obtenerServicios, crearServicio, modificarServicio };