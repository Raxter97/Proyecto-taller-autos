const User = require('../models/User.models');
const Empleado = require('../models/Empleado');
const Rol = require('../models/Rol');
const UserRol = require('../models/UserRol');
const { hashPassword } = require('../utils/Encriptacion');
const { calcularDVH } = require('../utils/CalculosDv');
const { actualizarDVV } = require('../utils/LogicaDvv');
const { registrarBitacora } = require('../services/BitacoraService');
const sequelize = require('../config/Database');

const registrarCuentaAdmin = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const { email, password, id_empleado, rolesIds } = req.body;
        if (!email || !password || !id_empleado || !rolesIds || !rolesIds.length) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Email, contraseña, empleado y al menos un rol son obligatorios.' });
        }

        const empleado = await Empleado.findByPk(
            id_empleado, { transaction: trans }
        );
        if (!empleado) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Empleado no encontrado.' });
        }

        if (!empleado.estado) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Empleado inactivo.' });
        }

        const cuentaExistente = await User.findOne({ 
            where: { id_empleado }, 
            transaction: trans 
        });
        if (cuentaExistente) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'El empleado ya posee una cuenta de usuario asociada.' });
        }

        const emailExistente = await User.findOne({ 
            where: { email }, 
            transaction: trans 
        });
        if (emailExistente) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'El correo electrónico ya está registrado.' });
        }

        const password_hash = await hashPassword(password);
        const datosDVH = {
            email,
            password_hash,
            estado: true,
            id_empleado: Number(id_empleado)
        };
        const dvh = calcularDVH(datosDVH);

        const nuevoUsuario = await User.create({
            email,
            password_hash,
            estado: true,
            id_empleado: Number(id_empleado),
            dvh
        }, { transaction: trans });

        for (const id_rol of rolesIds) {
            const datosDvhRol = {
                id_rol: Number(id_rol),
                id_usuario: nuevoUsuario.id_user
            };
            const dvhRol = calcularDVH(datosDvhRol);

            await UserRol.create({
                id_usuario: nuevoUsuario.id_user,
                id_rol: Number(id_rol),
                dvh: dvhRol
            }, { transaction: trans });
        }

        await actualizarDVV(User, 'users', 'id_user');
        await actualizarDVV(UserRol, 'user_rol', 'id_usuario_rol');

        await registrarBitacora({
            accion: 'ADMIN_REGISTRAR_CUENTA',
            descripcion: JSON.stringify({ id_user: nuevoUsuario.id_user, email, id_empleado, rolesIds }),
            nivel_impacto: 'Alta',
            id_usuario: req.user.id_user
        });

        await trans.commit();
        res.status(201).json({ mensaje: 'Cuenta de usuario creada y roles asignados exitosamente.' });
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

const modificarCuentaAdmin = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { email, estado, rolesIds } = req.body;

        const usuario = await User.findByPk(id, 
            { transaction: trans }
        );
        if (!usuario) {
            await trans.rollback();
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        const estadoPrevio = usuario.toJSON();
        if (email){
            usuario.email = email;
        } 
        if (estado !== undefined){
            usuario.estado = estado;
        } 

        const datosDVH = {
            email: usuario.email,
            password_hash: usuario.password_hash,
            estado: Boolean(usuario.estado),
            id_empleado: usuario.id_empleado
        };
        usuario.dvh = calcularDVH(datosDVH);
        await usuario.save({ transaction: trans });

        if (rolesIds && Array.isArray(rolesIds)) {
            await UserRol.destroy({ 
                where: { id_usuario: id }, 
                transaction: trans 
            });
            for (const id_rol of rolesIds) {
                const datosDvhRol = {
                    id_rol: Number(id_rol),
                    id_usuario: Number(id)
                };
                const dvhRol = calcularDVH(datosDvhRol);
                await UserRol.create({
                    id_usuario: Number(id),
                    id_rol: Number(id_rol),
                    dvh: dvhRol
                }, { transaction: trans });
            }
            await actualizarDVV(UserRol, 'user_rol', 'id_usuario_rol');
        }

        await actualizarDVV(User, 'users', 'id_user');
        await registrarBitacora({
            accion: 'ADMIN_MODIFICAR_CUENTA',
            descripcion: JSON.stringify({ previo: estadoPrevio, posterior: usuario.toJSON(), rolesIds }),
            nivel_impacto: 'Alta',
            id_usuario: req.user.id_user
        });

        await trans.commit();
        res.status(200).json({ mensaje: 'Cuenta y roles actualizados correctamente.' });
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

// CU-SAU-02.3: Desactivar cuenta de usuario (Baja lógica)
const desactivarCuentaAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        if (Number(id) === req.user.id_user) {
            return res.status(400).json({ mensaje: 'No puedes desactivar tu propia cuenta activa.' });
        }

        const usuario = await User.findByPk(id);
        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        const estadoPrevio = usuario.toJSON();
        usuario.estado = false;

        const datosDVH = {
            email: usuario.email,
            password_hash: usuario.password_hash,
            estado: false,
            id_empleado: usuario.id_empleado
        };
        usuario.dvh = calcularDVH(datosDVH);
        await usuario.save();

        await actualizarDVV(User, 'users', 'id_user');
        await registrarBitacora({
            accion: 'ADMIN_BAJA_LOGICA_CUENTA',
            descripcion: JSON.stringify({ previo: estadoPrevio, posterior: usuario.toJSON() }),
            nivel_impacto: 'Alta',
            id_usuario: req.user.id_user
        });

        res.status(200).json({ mensaje: 'Cuenta de usuario desactivada correctamente.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al desactivar la cuenta', error: error.message });
    }
};

const listarUsuarios = async (_req, res) => {
    try {
        const usuarios = await User.findAll({
            attributes: { exclude: ['password_hash', 'dvh'] },
            include: [{ model: Rol, as: 'roles', through: { attributes: [] } }]
        });
        res.status(200).json({ usuarios });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al listar usuarios', error: error.message });
    }
};

module.exports = {
    registrarCuentaAdmin,
    modificarCuentaAdmin,
    desactivarCuentaAdmin,
    listarUsuarios
};