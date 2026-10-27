const sequelize = require('../config/Database');
const Empleado = require('../models/Empleado');
const Informe = require('../models/Informe');
const { calcularDVH } = require('../utils/CalculosDv');
const { actualizarDVV } = require('../utils/LogicaDvv');
const { registrarBitacora } = require('../services/BitacoraService');

const obtenerEmpleados = async (req, res) => {
    try {
        let { page = 1, limit = 50 } = req.query;
        page = Math.max(1, parseInt(page, 10) || 1);
        limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
        
        const offset = (page - 1) * limit;

        const { count, rows: empleados } = await Empleado.findAndCountAll({
            limit,
            offset,
            order: [['id_empleado', 'ASC']]
        });

        res.status(200).json({
            totalRegistros: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            pageSize: empleados.length,
            empleados
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

const crearEmpleado = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        //agregar para cuarta entrega
        //  const { legajo, nombre, apellido, email, disponibilidad, sueldo, especialidades, rol } = req.body;
        
        const { legajo, nombre, apellido, email, disponibilidad, sueldo } = req.body;
        if (!legajo || !nombre || !apellido || !email || !disponibilidad || sueldo === undefined) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Campos faltantes.' });
        }

        // agregar para cuarta entrega 
        // if (rol === 'Mecánico' || rol === 'mecanico' || (especialidades && Array.isArray(especialidades))) {
        //     if (!especialidades || especialidades.length === 0) {
        //         await trans.rollback();
        //         return res.status(400).json({ 
        //             mensaje: 'No se puede guardar: se debe asignar al menos una competencia técnica básica al usuario operativo (mecánico).' 
        //         });
        //     }
        // }

        const empleadoExistente = await Empleado.findOne({ 
            where: { legajo },
            transaction: trans 
        });
        if (empleadoExistente) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'El legajo ya está asignado a otro empleado.' });
        }

        const datosDVH = {
            nombre,
            apellido,
            disponibilidad,
            email,
            estado: true,
            legajo: Number(legajo),
            sueldo: Number(sueldo).toFixed(2)
        };
        const dvh = calcularDVH(datosDVH);

        const nuevoEmpleado = await Empleado.create({
            legajo,
            nombre,
            apellido,
            email,
            disponibilidad,
            sueldo,
            estado: true,
            dvh
        }, { transaction: trans });

        await actualizarDVV(Empleado, 'empleados', 'id_empleado', { transaction: trans });
        await registrarBitacora({
            accion: 'INSERT_EMPLEADO',
            descripcion: JSON.stringify({ previo: null, posterior: nuevoEmpleado }),
            nivel_impacto: 'Media',
            id_usuario: req.user.id_user
        }, { transaction: trans });

        await trans.commit();
        res.status(201).json({ mensaje: 'Empleado registrado exitosamente'});
    } catch (error) {
        await trans.rollback();
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ 
                mensaje: 'El registro ya existe o viola una restricción única.', 
                campo: error.errors[0]?.path 
            });
        }
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

const modificarEmpleado = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { legajo, nombre, apellido, email, disponibilidad, sueldo, estado, especialidades, rol } = req.body;

        const empleado = await Empleado.findByPk(id, { transaction: trans });
        if (!empleado) {
            await trans.rollback();
            return res.status(404).json({ mensaje: 'Empleado no encontrado.' });
        }

        // agregar para cuarta entrega
        // if (rol === 'Mecánico' || rol === 'mecanico' || especialidades !== undefined) {
        //     if (especialidades && Array.isArray(especialidades) && especialidades.length === 0) {
        //         await trans.rollback();
        //         return res.status(400).json({ 
        //             mensaje: 'No se puede actualizar: el mecánico debe conservar al menos una competencia técnica básica.' 
        //         });
        //     }
        // }

        const estadoPrevio = empleado.toJSON();

        empleado.legajo = legajo ?? empleado.legajo;
        empleado.nombre = nombre ?? empleado.nombre;
        empleado.apellido = apellido ?? empleado.apellido;
        empleado.email = email ?? empleado.email;
        empleado.disponibilidad = disponibilidad ?? empleado.disponibilidad;
        empleado.sueldo = sueldo ?? empleado.sueldo;
        empleado.estado = estado !== undefined ? estado : empleado.estado;

        const datosDVH = {
            apellido: empleado.apellido,
            disponibilidad: empleado.disponibilidad,
            email: empleado.email,
            estado: Boolean(empleado.estado),
            legajo: Number(empleado.legajo),
            nombre: empleado.nombre,
            sueldo: Number(empleado.sueldo).toFixed(2)
        };
        empleado.dvh = calcularDVH(datosDVH);
        await empleado.save({ transaction: trans });

        await actualizarDVV(Empleado, 'empleados', 'id_empleado', { transaction: trans });
        await registrarBitacora({
            accion: 'UPDATE_EMPLEADO',
            descripcion: JSON.stringify({ previo: estadoPrevio, posterior: empleado.toJSON() }),
            nivel_impacto: 'Media',
            id_usuario: req.user.id_user
        }, { transaction: trans });

        await trans.commit();
        res.status(200).json({ mensaje: 'Empleado actualizado correctamente', empleado });
    } catch (error) {
        await trans.rollback();
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ 
                mensaje: 'El registro ya existe o viola una restricción única.', 
                campo: error.errors[0]?.path 
            });
        }
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

const desactivarEmpleado = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const { id } = req.params;
        const empleado = await Empleado.findByPk(
            id, { transaction: trans }
        );
        if (!empleado) {
            await trans.rollback();
            return res.status(404).json({ mensaje: 'Empleado no encontrado.' });
        }
        const informesAbiertos = await Informe.findOne({
            where: { id_empleado: id, estado: false },
            transaction: trans
        });
        if (informesAbiertos) {
            await trans.rollback(); 
            return res.status(400).json({ 
                mensaje: 'No se puede dar de baja: el empleado posee informes abiertos asignados.' 
            });
        }
        const estadoPrevio = empleado.toJSON();
        empleado.estado = false; 

        const datosDVH = {
            apellido: empleado.apellido,
            disponibilidad: empleado.disponibilidad,
            email: empleado.email,
            estado: false,
            legajo: Number(empleado.legajo),
            nombre: empleado.nombre,
            sueldo: Number(empleado.sueldo).toFixed(2)
        };
        empleado.dvh = calcularDVH(datosDVH);
        await empleado.save({ transaction: trans });

        await actualizarDVV(Empleado, 'empleados', 'id_empleado', { transaction: trans });
        await registrarBitacora({
            accion: 'BAJA_LOGICA_EMPLEADO',
            descripcion: JSON.stringify({ previo: estadoPrevio, posterior: empleado.toJSON() }),
            nivel_impacto: 'Alta',
            id_usuario: req.user.id_user
        }, { transaction: trans });

        await trans.commit();
        res.status(200).json({ mensaje: 'Empleado dado de baja lógica correctamente' });
    } catch (error) {
        await trans.rollback();
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

module.exports = { crearEmpleado, modificarEmpleado, desactivarEmpleado,obtenerEmpleados };