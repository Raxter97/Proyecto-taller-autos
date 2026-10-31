const Turno = require('../models/Turno');
const Cliente = require('../models/Cliente');
const Auto = require('../models/Auto');
const { registrarBitacora } = require('../services/BitacoraService');
const { calcularDVH } = require('../utils/CalculosDv');
const { actualizarDVV } = require('../utils/LogicaDvv');
const sequelize = require('../config/Database');

const consultarTurnos = async (req, res) => {
    try {
        let { page = 1, limit = 50 } = req.query;
        page = Math.max(1, parseInt(page, 10) || 1);
        limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
        const offset = (page - 1) * limit;

        const turnos = await Turno.findAll({
            limit,
            offset,
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

const consultarTurnosUser = async (req, res) => {
  try {
    // 1. Buscar el cliente vinculado al email del token actual
    const cliente = await Cliente.findOne({ where: { email: req.user.email } });
    if (!cliente) {
      return res.status(404).json({ mensaje: 'No hay un perfil de cliente asociado a esta cuenta.' });
    }

    // 2. Traer solo los turnos que pertenecen a su id_cliente
    const turnos = await Turno.findAll({
      where: { id_cliente: cliente.id_cliente },
      include: [{ model: Auto, attributes: ['marca', 'modelo', 'patente'] }]
    });

    res.status(200).json({ turnos });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al consultar tus turnos.', error: error.message });
  }
};

const agendarTurno = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const { fecha_hora, id_cliente, id_auto } = req.body;
        if (!fecha_hora || !id_cliente || !id_auto) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Fecha, hora, cliente y vehículo son obligatorios.' });
        }

        const cliente = await Cliente.findByPk(id_cliente, { transaction: trans });
        if (!cliente) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'El cliente no existe.' });
        }
        if (!cliente.estado) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'El cliente se encuentra inactivo.' });
        }

        const auto = await Auto.findByPk(id_auto, { transaction: trans });
        if (!auto) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'El vehículo no existe .' });
        }
        if (!auto.estado) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'El vehículo se encuentra inactivo.' });
        }

        if (Number(auto.id_cliente) !== Number(id_cliente)) {
           return res.status(400).json({ mensaje: 'El vehículo seleccionado no pertenece al cliente indicado.' });
        }

        const estadoTurno = 'Agendado';
        const datosDVH = {
            estado: estadoTurno,
            fecha_hora,
            id_auto: Number(id_auto),
            id_cliente: Number(id_cliente)
        };
        const dvh = calcularDVH(datosDVH);

        const nuevoTurno = await Turno.create({
            fecha_hora,
            estado: estadoTurno,
            id_cliente: Number(id_cliente),
            id_auto: Number(id_auto),
            dvh
        }, { transaction: trans });

        await actualizarDVV(Turno, 'turnos', 'id_turno', { transaction: trans });

        await registrarBitacora({
            accion: 'INSERT_TURNO',
            descripcion: JSON.stringify({ Turno: nuevoTurno }),
            nivel_impacto: 'Media',
            id_usuario: req.user.id_user
        }, { transaction: trans });

        await trans.commit();
        res.status(201).json({ mensaje: 'Turno agendado exitosamente' });
    } catch (error) {
        await trans.rollback();
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

const reprogramarTurno = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { fecha_hora } = req.body;

        const turno = await Turno.findByPk(id, { transaction: trans });
        if (!turno) {
            await trans.rollback();
            return res.status(404).json({ mensaje: 'Turno no encontrado.' });
        }

        const estadoPrevio = turno.toJSON();
        turno.fecha_hora = fecha_hora ?? turno.fecha_hora;
        turno.estado = 'Confirmado';

        const datosDVH = {
            estado: turno.estado,
            fecha_hora: turno.fecha_hora,
            id_auto: Number(turno.id_auto),
            id_cliente: Number(turno.id_cliente)
        };
        turno.dvh = calcularDVH(datosDVH);
        await turno.save({ transaction: trans });

        await actualizarDVV(Turno, 'turnos', 'id_turno', { transaction: trans });

        await registrarBitacora({
            accion: 'UPDATE_TURNO',
            descripcion: JSON.stringify({ previo: estadoPrevio, posterior: turno.toJSON() }),
            nivel_impacto: 'Media',
            id_usuario: req.user.id_user
        }, { transaction: trans });

        await trans.commit();
        res.status(200).json({ mensaje: 'Turno reprogramado correctamente' });
    } catch (error) {
        await trans.rollback();
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

const cancelarTurno = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const { id } = req.params;
        const turno = await Turno.findByPk(id, { transaction: trans });
        if (!turno) {
            await trans.rollback();
            return res.status(404).json({ mensaje: 'Turno no encontrado.' });
        }

        const estadoPrevio = turno.toJSON();
        turno.estado = 'Cancelado';

        const datosDVH = {
            estado: turno.estado,
            fecha_hora: turno.fecha_hora,
            id_auto: Number(turno.id_auto),
            id_cliente: Number(turno.id_cliente)
        };
        turno.dvh = calcularDVH(datosDVH);
        await turno.save({ transaction: trans });

        await actualizarDVV(Turno, 'turnos', 'id_turno', { transaction: trans });

        await registrarBitacora({
            accion: 'CANCEL_TURNO',
            descripcion: JSON.stringify({ previo: estadoPrevio, posterior: turno.toJSON() }),
            nivel_impacto: 'Baja',
            id_usuario: req.user.id_user
        }, { transaction: trans });

        await trans.commit();
        res.status(200).json({ mensaje: 'Turno cancelado correctamente' });
    } catch (error) {
        await trans.rollback();
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

module.exports = { 
    consultarTurnos, 
    consultarTurnosUser,
    agendarTurno, 
    reprogramarTurno, 
    cancelarTurno 
};