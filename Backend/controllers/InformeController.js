const Informe = require('../models/Informe');
const Auto = require('../models/Auto');
const Empleado = require('../models/Empleado');
const Repuesto = require('../models/Repuesto');
const { RepuestoUsado, ServicioRealizado } = require('../models/DetallesInforme');
const { calcularDVH } = require('../utils/CalculosDv');
const { actualizarDVV } = require('../utils/LogicaDvv');
const { registrarBitacora } = require('../services/BitacoraService');
const sequelize = require('../config/Database');

const crearInforme = async (req, res) => {
    try {
        const { id_auto, id_empleado, descripcion } = req.body;
        if (!id_auto || !id_empleado || !descripcion) {
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
        }

        const auto = await Auto.findByPk(id_auto);
        if (!auto || !auto.estado) return res.status(400).json({ mensaje: 'Vehículo inválido o inactivo.' });

        const empleado = await Empleado.findByPk(id_empleado);
        if (!empleado || !empleado.estado) return res.status(400).json({ mensaje: 'Empleado inválido o inactivo.' });

        const fecha = new Date().toISOString().split('T')[0];
        const estado = false; // False = En Proceso[cite: 39]

        const datosDVH = { descripcion, estado: false, fecha, id_auto: Number(id_auto), id_empleado: Number(id_empleado) };
        const dvh = calcularDVH(datosDVH);

        const nuevoInforme = await Informe.create({
            fecha, descripcion, estado, dvh,
            id_auto: Number(id_auto),
            id_empleado: Number(id_empleado)
        });

        await actualizarDVV(Informe, 'informes', 'id_informe');
        await registrarBitacora({
            accion: 'INSERT_INFORME',
            descripcion: JSON.stringify({ posterior: nuevoInforme }),
            nivel_impacto: 'Media',
            id_usuario: req.user?.id_user || 1
        });

        res.status(201).json({ mensaje: 'Informe abierto exitosamente', informe: nuevoInforme });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear informe', error: error.message });
    }
};

const imputarRepuesto = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id_informe } = req.params;
        const { id_repuesto, cantidad } = req.body;

        const informe = await Informe.findByPk(id_informe, { transaction: t });
        if (!informe || informe.estado === true) {
            await t.rollback();
            return res.status(400).json({ mensaje: 'Informe no encontrado o ya finalizado.' });
        }

        const repuesto = await Repuesto.findByPk(id_repuesto, { transaction: t });
        if (!repuesto || !repuesto.estado || repuesto.stock < cantidad) {
            await t.rollback();
            return res.status(400).json({ mensaje: 'Repuesto inválido o stock insuficiente.' });
        }

        repuesto.stock -= Number(cantidad);
        await repuesto.save({ transaction: t });

        const repuestoUsado = await RepuestoUsado.create({
            id_informe: Number(id_informe),
            id_repuesto: Number(id_repuesto),
            cantidad: Number(cantidad)
        }, { transaction: t });

        const datosDVH = {
            descripcion: informe.descripcion,
            estado: informe.estado,
            fecha: informe.fecha,
            id_auto: informe.id_auto,
            id_empleado: informe.id_empleado
        };
        informe.dvh = calcularDVH(datosDVH);
        await informe.save({ transaction: t });

        await actualizarDVV(Informe, 'informes', 'id_informe');
        await registrarBitacora({
            accion: 'INSERT_REPUESTO_USADO',
            descripcion: JSON.stringify({ id_informe, id_repuesto, cantidad }),
            nivel_impacto: 'Media',
            id_usuario: req.user?.id_user || 1
        });

        await t.commit();
        res.status(200).json({ mensaje: 'Repuesto imputado correctamente', repuestoUsado });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ mensaje: 'Error al imputar repuesto', error: error.message });
    }
};

const imputarServicio = async (req, res) => {
    try {
        const { id_informe } = req.params;
        const { id_servicio } = req.body;

        const informe = await Informe.findByPk(id_informe);
        if (!informe || informe.estado === true) {
            return res.status(400).json({ mensaje: 'Informe no encontrado o ya finalizado.' });
        }

        const servicioRealizado = await ServicioRealizado.create({
            id_informe: Number(id_informe),
            id_servicio: Number(id_servicio)
        });

        await registrarBitacora({
            accion: 'INSERT_SERVICIO_REALIZADO',
            descripcion: JSON.stringify({ id_informe, id_servicio }),
            nivel_impacto: 'Baja',
            id_usuario: req.user?.id_user || 1
        });

        res.status(201).json({ mensaje: 'Servicio imputado correctamente', servicioRealizado });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al imputar servicio', error: error.message });
    }
};

const finalizarInforme = async (req, res) => {
    try {
        const { id_informe } = req.params;
        const informe = await Informe.findByPk(id_informe);

        if (!informe || informe.estado === true) {
            return res.status(400).json({ mensaje: 'Informe no encontrado o ya finalizado.' });
        }

        const cantServicios = await ServicioRealizado.count({ where: { id_informe } });
        const cantRepuestos = await RepuestoUsado.count({ where: { id_informe } });

        if (cantServicios === 0 && cantRepuestos === 0) {
            return res.status(400).json({ mensaje: 'El informe debe tener al menos un servicio o repuesto para finalizar.' });
        }

        informe.estado = true; // True = Finalizado[cite: 39]
        const datosDVH = {
            descripcion: informe.descripcion,
            estado: true,
            fecha: informe.fecha,
            id_auto: informe.id_auto,
            id_empleado: informe.id_empleado
        };
        informe.dvh = calcularDVH(datosDVH);
        await informe.save();

        await actualizarDVV(Informe, 'informes', 'id_informe');
        await registrarBitacora({
            accion: 'FINALIZAR_INFORME',
            descripcion: JSON.stringify({ id_informe }),
            nivel_impacto: 'Alta',
            id_usuario: req.user?.id_user || 1
        });

        res.status(200).json({ mensaje: 'Informe técnico finalizado correctamente', informe });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al finalizar informe', error: error.message });
    }
};

module.exports = { crearInforme, imputarRepuesto, imputarServicio, finalizarInforme };