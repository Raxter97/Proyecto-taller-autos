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
        const { patente, legajo, descripcion } = req.body;
        if (!patente || !legajo || !descripcion) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
        }

        const auto = await Auto.findOne({ 
            where: { patente: patente.toUpperCase() }, 
            transaction: trans 
        });

        if (!auto) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Vehículo inválido' });
        }
        if (!auto.estado) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Vehículo inactivo.' });
        }

        const empleado = await Empleado.findOne({ 
            where: { legajo: Number(legajo) }, 
            transaction: trans 
        });

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
            id_auto: Number(auto.id_auto), 
            id_empleado: Number(empleado.id_empleado) 
        };
        const dvh = calcularDVH(datosDVH);

        const nuevoInforme = await Informe.create({
            fecha, descripcion, estado, dvh,
            id_auto: Number(auto.id_auto),
            id_empleado: Number(empleado.id_empleado)
        }, { transaction: trans });

        // ACTUALIZAR TURNO A 'Atendido'
        const turnoAsociado = await Turno.findOne({
            where: { 
                id_auto: Number(auto.id_auto),
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
            id_user: req.user.id_user
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
        const { descripcionRepuesto, cantidad } = req.body;

       if (!descripcionRepuesto || !cantidad) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'La descripción del repuesto y la cantidad son obligatorias.' });
        }

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

        const repuesto = await Repuesto.findOne({ 
            where: { descripcion: descripcionRepuesto }, 
            transaction: trans 
        });

        if (!repuesto ) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Repuesto inválido .' });
        }
        if (!repuesto.estado) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Repuesto no encontrado.' });
        }
        if (repuesto.stock < cantidad) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Stock insuficiente.' });
        }

        repuesto.stock -= Number(cantidad);
        await repuesto.save({ transaction: trans });

        const repuestoUsado = await RepuestoUsado.create({
            id_informe: Number(id_informe),
            id_repuesto: Number(repuesto.id_repuesto),
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
            descripcion: JSON.stringify({ id_informe, id_repuesto: repuesto.id_repuesto, cantidad }),
            nivel_impacto: 'Media',
            id_user: req.user.id_user
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
        const { descripcionServicio } = req.body;

        if (!descripcionServicio) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'La descripción del servicio es obligatoria.' });
        }

        const informe = await Informe.findByPk(id_informe, { transaction: trans });
        if (!informe) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Informe no encontrado.' });
        }
        if (informe.estado === true) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Informe ya finalizado.' });
        }

        const servicio = await Servicio.findOne({ 
            where: { descripcion: descripcionServicio }, 
            transaction: trans 
        });
        if (!servicio) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Servicio no encontrado por descripción.' });
        }
        if (!servicio.estado) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'El servicio se encuentra inactivo.' });
        }

        const servicioRealizado = await ServicioRealizado.create({
            id_informe: Number(id_informe),
            id_servicio: Number(servicio.id_servicio)
        }, { transaction: trans });

        await registrarBitacora({
            accion: 'INSERT_SERVICIO_REALIZADO',
            descripcion: JSON.stringify({ id_informe, id_servicio: servicio.id_servicio }),
            nivel_impacto: 'Baja',
            id_user: req.user.id_user
        }, { transaction: trans });

        await trans.commit();
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
            id_user: req.user.id_user
        }, { transaction: trans });

        res.status(200).json({ mensaje: 'Informe técnico finalizado correctamente', informe });
    } catch (error) {
        await trans.rollback();
        res.status(500).json({ mensaje: 'Error al finalizar informe', error: error.message });
    }
};

const obtenerInformes = async (req, res) => {
    try {
        const informes = await Informe.findAll({
            include: [
                { model: Auto, as: 'auto' },
                { model: Empleado, as: 'empleado' },
                { model: RepuestoUsado, as: 'repuestosUsados' },
                { model: ServicioRealizado, as: 'serviciosRealizados' }
            ]
        });
        res.status(200).json({ informes });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los informes', error: error.message });
    }
};

module.exports = { crearInforme, imputarRepuesto, imputarServicio, finalizarInforme, obtenerInformes };