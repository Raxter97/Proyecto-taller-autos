const sequelize = require('../config/Database');
const Turno = require('../models/Turno');
const Informe = require('../models/Informe');
const Auto = require('../models/Auto');
const Empleado = require('../models/Empleado');
const Repuesto = require('../models/Repuesto');
const { RepuestoUsado, ServicioRealizado } = require('../models/DetalleInforme');
const { calcularDVH } = require('../utils/CalculosDv');
const { actualizarDVV } = require('../utils/LogicaDvv');
const { registrarBitacora } = require('../services/BitacoraService');

const crearInforme = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const { id_auto, id_empleado, descripcion } = req.body;
        if (!id_auto || !id_empleado || !descripcion) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
        }

        const auto = await Auto.findByPk(
            id_auto, { transaction: trans }
        );
        if (!auto) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Vehículo inválido' });
        }
        if (!auto.estado) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Vehículo inactivo.' });
        }

        const empleado = await Empleado.findByPk(
            id_empleado, { transaction: trans }
        );
        if (!empleado ) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Empleado inválido' });
        }
        if (!empleado.estado) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Empleado inactivo.' });
        }

        const fecha = new Date().toLocaleDateString('en-CA');
        const estado = false; 

        const datosDVH = { 
            descripcion, 
            estado: false, 
            fecha, 
            id_auto: Number(id_auto), 
            id_empleado: Number(id_empleado) 
        };
        const dvh = calcularDVH(datosDVH);

        const nuevoInforme = await Informe.create({
            fecha, descripcion, estado, dvh,
            id_auto: Number(id_auto),
            id_empleado: Number(id_empleado)
        }, { transaction: trans });

        // BUSCAR Y ACTUALIZAR EL TURNO ASOCIADO A 'Atendido'
        const turnoAsociado = await Turno.findOne({
            where: { 
                id_auto: Number(id_auto),
                estado: ['Agendado', 'Confirmado']
            },
            order: [['fecha_hora', 'ASC']],
            transaction: trans
        });

        if (turnoAsociado) {
            turnoAsociado.estado = 'Atendido';
            await turnoAsociado.save({ transaction: trans });
        }

        await actualizarDVV(Informe, 'informes', 'id_informe', { transaction: trans });
        await registrarBitacora({
            accion: 'INSERT_INFORME',
            descripcion: JSON.stringify({ informe: nuevoInforme }),
            nivel_impacto: 'Media',
            id_usuario: req.user.id_user
        }, { transaction: trans });

        await trans.commit();
        res.status(201).json({ mensaje: 'Informe abierto exitosamente y turno marcado como atendido' });
    } catch (error) {
        await trans.rollback();
        res.status(500).json({ mensaje: 'Error al crear informe', error: error.message });
    }
};

const imputarRepuesto = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const { id_informe } = req.params;
        const { id_repuesto, cantidad } = req.body;

        const informe = await Informe.findByPk(
            id_informe,
             { transaction: trans }
            );
        if (!informe ) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Informe no encontrado.' });
        }
        if (informe.estado === true) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Informe finalizado.' });
        }

        const repuesto = await Repuesto.findByPk(
            id_repuesto, 
            { transaction: trans }
        );
        if (!repuesto ) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Repuesto inválido .' });
        }
        if (!repuesto.estado) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Repuesto no encontrado.' });
        }if (repuesto.stock < cantidad) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Stock insuficiente.' });
        }

        repuesto.stock -= Number(cantidad);
        await repuesto.save({ transaction: trans });

        const repuestoUsado = await RepuestoUsado.create({
            id_informe: Number(id_informe),
            id_repuesto: Number(id_repuesto),
            cantidad: Number(cantidad)
        }, { transaction: trans });

        const datosDVH = {
            descripcion: informe.descripcion,
            estado: informe.estado,
            fecha: informe.fecha,
            id_auto: informe.id_auto,
            id_empleado: informe.id_empleado
        };
        informe.dvh = calcularDVH(datosDVH);
        await informe.save({ transaction: trans });

        await actualizarDVV(Informe, 'informes', 'id_informe', { transaction: trans });
        await registrarBitacora({
            accion: 'INSERT_REPUESTO_USADO',
            descripcion: JSON.stringify({ id_informe, id_repuesto, cantidad }),
            nivel_impacto: 'Media',
            id_usuario: req.user.id_user
        }, { transaction: trans });

        await trans.commit();
        res.status(200).json({ mensaje: 'Repuesto imputado correctamente', repuestoUsado });
    } catch (error) {
        await trans.rollback();
        res.status(500).json({ mensaje: 'Error al imputar repuesto', error: error.message });
    }
};

const imputarServicio = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const { id_informe } = req.params;
        const { id_servicio } = req.body;

        const informe = await Informe.findByPk(id_informe);
        if (!informe ) {
            return res.status(400).json({ mensaje: 'Informe no encontrado.' });
        }
        if (informe.estado === true) {
            return res.status(400).json({ mensaje: 'Informe ya finalizado.' });
        }

        const servicioRealizado = await ServicioRealizado.create({
            id_informe: Number(id_informe),
            id_servicio: Number(id_servicio)
        }, { transaction: trans });

        await registrarBitacora({
            accion: 'INSERT_SERVICIO_REALIZADO',
            descripcion: JSON.stringify({ id_informe, id_servicio }),
            nivel_impacto: 'Baja',
            id_usuario: req.user.id_user
        }, { transaction: trans });
        res.status(201).json({ mensaje: 'Servicio imputado correctamente', servicioRealizado });
    } catch (error) {
        await trans.rollback();
        res.status(500).json({ mensaje: 'Error al imputar servicio', error: error.message });
    }
};

const finalizarInforme = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const { id_informe } = req.params;
        const informe = await Informe.findByPk(id_informe, { transaction: trans });

        if (!informe ) {
            return res.status(400).json({ mensaje: 'Informe no encontrado.' });
        }
        if (informe.estado === true) {
            return res.status(400).json({ mensaje: 'Informe ya finalizado.' });
        }


        const cantServicios = await ServicioRealizado.count({ 
            where: { id_informe } 
        });
        const cantRepuestos = await RepuestoUsado.count({ 
            where: { id_informe } 
        });

        if (cantServicios === 0 && cantRepuestos === 0) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'El informe debe tener al menos un servicio o repuesto para finalizar.' });
        }

        informe.estado = true; 
        const datosDVH = {
            descripcion: informe.descripcion,
            estado: true,
            fecha: informe.fecha,
            id_auto: informe.id_auto,
            id_empleado: informe.id_empleado
        };
        informe.dvh = calcularDVH(datosDVH);
        await informe.save({ transaction: trans });

        await actualizarDVV(Informe, 'informes', 'id_informe', { transaction: trans });
        await registrarBitacora({
            accion: 'FINALIZAR_INFORME',
            descripcion: JSON.stringify({ id_informe }),
            nivel_impacto: 'Alta',
            id_usuario: req.user.id_user
        }, { transaction: trans });

        res.status(200).json({ mensaje: 'Informe técnico finalizado correctamente', informe });
    } catch (error) {
        await trans.rollback();
        res.status(500).json({ mensaje: 'Error al finalizar informe', error: error.message });
    }
};

module.exports = { crearInforme, imputarRepuesto, imputarServicio, finalizarInforme };