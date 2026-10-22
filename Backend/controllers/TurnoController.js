const Turno = require('../models/Turno');
const Cliente = require('../models/Cliente');
const Auto = require('../models/Auto');
const { registrarBitacora } = require('../services/BitacoraService');

const consultarTurnos = async (req, res) => {
    try {
        const turnos = await Turno.findAll({
            include: [
                { model: Cliente, attributes: ['nombre', 'apellido', 'dni'] },
                { model: Auto, attributes: ['patente', 'marca', 'modelo'] }
            ],
            order: [['fecha_hora', 'ASC']]
        });
        res.status(200).json({ turnos });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

const agendarTurno = async (req, res) => {
    try {
        const { fecha_hora, id_cliente, id_auto } = req.body;
        if (!fecha_hora || !id_cliente || !id_auto) {
            return res.status(400).json({ mensaje: 'Fecha, hora, cliente y vehículo son obligatorios.' });
        }

        const cliente = await Cliente.findByPk(id_cliente);
        if (!cliente || !cliente.estado) {
            return res.status(400).json({ mensaje: 'El cliente no existe o se encuentra inactivo.' });
        }

        const auto = await Auto.findByPk(id_auto);
        if (!auto || !auto.estado) {
            return res.status(400).json({ mensaje: 'El vehículo no existe o se encuentra inactivo.' });
        }

        const nuevoTurno = await Turno.create({
            fecha_hora,
            estado: 'Agendado',
            id_cliente,
            id_auto
        });

        await registrarBitacora({
            accion: 'INSERT_TURNO',
            descripcion: JSON.stringify({ Turno : nuevoTurno }),
            nivel_impacto: 'Media',
            id_usuario: req.user?.id_user || 1
        });

        res.status(201).json({ mensaje: 'Turno agendado exitosamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

const reprogramarTurno = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha_hora } = req.body;

        const turno = await Turno.findByPk(id);
        if (!turno) {
            return res.status(404).json({ mensaje: 'Turno no encontrado.' });
        }

        const estadoPrevio = turno.toJSON();
        turno.fecha_hora = fecha_hora ?? turno.fecha_hora;
        turno.estado = 'Confirmado';
        await turno.save();

        await registrarBitacora({
            accion: 'UPDATE_TURNO',
            descripcion: JSON.stringify({ previo: estadoPrevio, posterior: turno.toJSON() }),
            nivel_impacto: 'Media',
            id_usuario: req.user?.id_user || 1
        });

        res.status(200).json({ mensaje: 'Turno reprogramado correctamente'});
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

const cancelarTurno = async (req, res) => {
    try {
        const { id } = req.params;
        const turno = await Turno.findByPk(id);
        if (!turno) {
            return res.status(404).json({ mensaje: 'Turno no encontrado.' });
        }

        const estadoPrevio = turno.toJSON();
        turno.estado = 'Cancelado';
        await turno.save();

        await registrarBitacora({
            accion: 'CANCEL_TURNO',
            descripcion: JSON.stringify({ previo: estadoPrevio, posterior: turno.toJSON() }),
            nivel_impacto: 'Baja',
            id_usuario: req.user?.id_user || 1
        });

        res.status(200).json({ mensaje: 'Turno cancelado correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

module.exports = { 
    consultarTurnos, 
    agendarTurno, 
    reprogramarTurno, 
    cancelarTurno 
};