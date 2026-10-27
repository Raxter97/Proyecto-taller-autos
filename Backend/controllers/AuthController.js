const User = require("../models/User.models");
const {comparePassword, hashPassword} = require('../utils/Encriptacion');
const {calcularDVH} = require('../utils/CalculosDv');
const {actualizarDVV, verificarDVVTabla} = require('../utils/LogicaDvv');
const {limpiarDatosUsuario}= require('../utils/LimpiezaDatos');
const { registrarBitacora } = require('../services/BitacoraService');
const jwt = require('jsonwebtoken');
const sequelize = require('../config/Database');

const login = async(req, res) => {
    const trans = await sequelize.transaction();
    try { 
        const {email, password} = req.body;
        if (!email || !password) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Email y contraseña requeridos.' });
        }
        const user = await User.findOne({
            where: { email: email },
            transaction: trans
        });

        if (!user) {
            await trans.rollback();
            return res.status(401).json({ mensaje: 'Datos inválidos' });
        }

        // Verificación de integridad global DVV de la tabla (Protocolo ante Discrepancia CU-SAU-01)
        try {
            await verificarDVVTabla(User, 'users', 'id_user', req, { transaction: trans });
        } catch (dvvError) {
            await trans.rollback();
            return res.status(403).json({ 
                mensaje: '[CRÍTICO] Alteración de datos detectada en el sistema. Inicio de sesión bloqueado.' 
            });
        }

        if (!user.estado) {
            await trans.rollback();
            return res.status(401).json({ mensaje: 'User inactivo' });    
        }

        if (user.bloqueado_hasta && new Date() < new Date(user.bloqueado_hasta)) {
            await trans.rollback();
            return res.status(403).json({ 
                mensaje: 'Cuenta bloqueada temporalmente por 15 minutos debido a múltiples intentos fallidos.' 
            });
        }

        const passtemporal = await comparePassword(password, user.password_hash);
        if (!passtemporal) {
            user.intentos_fallidos = (user.intentos_fallidos || 0) + 1;
            
            if (user.intentos_fallidos >= 3) {
                user.bloqueado_hasta = new Date(Date.now() + 15 * 60 * 1000); 
            }

            const datosDVH = {
                email: user.email,
                password_hash: user.password_hash,
                estado: Boolean(user.estado),
                id_empleado: user.id_empleado || null,
                intentos_fallidos: user.intentos_fallidos,
                bloqueado_hasta: user.bloqueado_hasta
            };
            user.dvh = calcularDVH(datosDVH);
            await user.save({ transaction: trans });
            await actualizarDVV(User, 'users', 'id_user', { transaction: trans });
            await trans.commit();

            if (user.intentos_fallidos >= 3) {
                return res.status(403).json({ 
                    mensaje: 'Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.' 
                });
            }
            return res.status(401).json({ mensaje: 'Datos inválidos' });
        }

        user.intentos_fallidos = 0;
        user.bloqueado_hasta = null;
        
        const datosDVH = {
            email: user.email,
            password_hash: user.password_hash,
            estado: Boolean(user.estado),
            id_empleado: user.id_empleado || null,
            intentos_fallidos: user.intentos_fallidos,
            bloqueado_hasta: user.bloqueado_hasta
        };
        const nuevohash = calcularDVH(datosDVH);
        if (user.dvh != nuevohash) {
            await trans.rollback();
            return res.status(403).json({ mensaje: 'Error de integridad en la cuenta.' });
        }

        user.dvh = nuevohash;
        await user.save({ transaction: trans });
        await actualizarDVV(User, 'users', 'id_user', { transaction: trans });

        await registrarBitacora({
            accion: 'LOGIN_EXITOSO',
            descripcion: JSON.stringify({ email: user.email, acceso: 'Exitoso' }),
            nivel_impacto: 'Baja',
            id_usuario: user.id_user
        }, { transaction: trans });

        await trans.commit();

        const token = jwt.sign(
            { id_user: user.id_user, email: user.email, id_empleado: user.id_empleado }, 
            process.env.JWT_SECRET || 'secreto',
            { expiresIn: '15m' }
        );
        
        res.status(200).json({ mensaje: 'Inicio de sesion exitoso', token });
    } catch(error) {
        await trans.rollback();
        res.status(500).json({ mensaje: 'Error interno del servidor.', error: error.message });
    }
};

const registro = async(req, res) => {
    const trans = await sequelize.transaction();
    try {
        const {email, password} = req.body; 
        if (!email || !password) {  
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
        }
        
        const userExistente = await User.findOne({ 
            where: { email },
            transaction: trans 
        });
        if (userExistente) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'El email ya está registrado' });
        }

        const password_hash = await hashPassword(password);
        const datosDVH = {
            email,
            password_hash,
            estado: true,
            id_empleado: null,
            intentos_fallidos: 0,
            bloqueado_hasta: null
        };
        const dvh = calcularDVH(datosDVH);
        const newUser = await User.create({
            email,
            password_hash,
            dvh,
            estado: true,
            intentos_fallidos: 0,
            bloqueado_hasta: null,
            id_empleado: null
        }, { transaction: trans });
        
        await actualizarDVV(User, 'users', 'id_user', { transaction: trans });

        await registrarBitacora({
            accion: 'REGISTRO_EXITOSO',
            descripcion: JSON.stringify({ Usuario: newUser.toJSON() }),
            nivel_impacto: 'Baja',
            id_usuario: newUser.id_user 
        }, { transaction: trans });

        await trans.commit();
        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            user: {
                id_user: newUser.id_user,
                email: newUser.email,
                id_empleado: newUser.id_empleado
            }
        });
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

const obtenerPerfil = async(req, res) => {
    try {
        const user = await User.findByPk(req.user.id_user, {
            attributes: { exclude: ['password_hash', 'dvh'] }
        });
        if (!user) {
            return res.status(404).json({ mensaje: "User no encontrado" });
        }
        res.status(200).json({ user });
    } catch(error) {
        res.status(500).json({ mensaje: 'Error interno del servidor.', error: error.message });
    }
};

const actualizarEmail = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const { nuevoEmail } = req.body;
        if (!nuevoEmail) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'El nuevo correo es obligatorio.' });
        }

        const user = await User.findByPk(req.user.id_user, { transaction: trans });
        if (!user) {
            await trans.rollback();
            return res.status(404).json({ mensaje: 'User no encontrado.' });
        }

        const emailExistente = await User.findOne({ 
            where: { email: nuevoEmail },
            transaction: trans 
        });

        if (emailExistente) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'El correo electrónico ya está en uso por otra cuenta.' });
        }

        const estadoPrevio = user.toJSON();
        user.email = nuevoEmail;

        const datosDVH = {
            email: user.email,
            password_hash: user.password_hash,
            estado: Boolean(user.estado),
            id_empleado: user.id_empleado,
            intentos_fallidos: user.intentos_fallidos,
            bloqueado_hasta: user.bloqueado_hasta
        };
        
        user.dvh = calcularDVH(datosDVH);
        await user.save({ transaction: trans });

        await actualizarDVV(User, 'users', 'id_user', { transaction: trans });

        await registrarBitacora({
            accion: 'UPDATE_EMAIL_USUARIO',
            descripcion: JSON.stringify({ 
                previo: limpiarDatosUsuario(estadoPrevio), 
                posterior: limpiarDatosUsuario(user) 
            }),
            nivel_impacto: 'Media',
            id_usuario: user.id_user
        }, { transaction: trans });

        await trans.commit();
        res.status(200).json({ mensaje: 'Correo electrónico actualizado con éxito', email: user.email });
    } catch (error) {
        await trans.rollback();
        res.status(500).json({ mensaje: 'Error interno del servidor.', error: error.message });
    }
};

const actualizarPassword = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const { passwordActual, passwordNueva } = req.body;
        if (!passwordActual || !passwordNueva) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'La contraseña actual y la nueva son obligatorias.' });
        }

        const user = await User.findByPk(req.user.id_user, { transaction: trans });
        if (!user) {
            await trans.rollback();
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        const passwordValida = await comparePassword(passwordActual, user.password_hash);
        if (!passwordValida) {
            await trans.rollback();
            return res.status(401).json({ mensaje: 'La contraseña actual es incorrecta.' });
        }

        const estadoPrevio = user.toJSON();
        user.password_hash = await hashPassword(passwordNueva);

        const datosDVH = {
            email: user.email,
            password_hash: user.password_hash,
            estado: Boolean(user.estado),
            id_empleado: user.id_empleado,
            intentos_fallidos: user.intentos_fallidos,
            bloqueado_hasta: user.bloqueado_hasta
        };
        user.dvh = calcularDVH(datosDVH);
        await user.save({ transaction: trans });

        await actualizarDVV(User, 'users', 'id_user', { transaction: trans });
        await registrarBitacora({
            accion: 'UPDATE_PASSWORD',
            descripcion: JSON.stringify({ 
                previo: limpiarDatosUsuario(estadoPrevio), 
                posterior: limpiarDatosUsuario(user) 
            }),
            nivel_impacto: 'Alta',
            id_usuario: user.id_user
        }, { transaction: trans });

        await trans.commit();
        res.status(200).json({ mensaje: 'Contraseña actualizada con éxito.' });
    } catch (error) {
        await trans.rollback();
        res.status(500).json({ mensaje: 'Error interno del servidor.', error: error.message });
    }
};

const recuperarPassword = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const { email, nuevaPassword } = req.body;
        if (!email || !nuevaPassword) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'El correo y la nueva contraseña son obligatorios.' });
        }

        const user = await User.findOne({ where: { email }, transaction: trans });
        if (!user) {
            await trans.rollback();
            return res.status(404).json({ mensaje: 'No existe una cuenta asociada a este correo.' });
        }

        const estadoPrevio = user.toJSON();
        user.password_hash = await hashPassword(nuevaPassword);
        user.intentos_fallidos = 0;
        user.bloqueado_hasta = null;

        const datosDVH = {
            email: user.email,
            password_hash: user.password_hash,
            estado: Boolean(user.estado),
            id_empleado: user.id_empleado,
            intentos_fallidos: user.intentos_fallidos,
            bloqueado_hasta: user.bloqueado_hasta
        };
        user.dvh = calcularDVH(datosDVH);
        await user.save({ transaction: trans });

        await actualizarDVV(User, 'users', 'id_user', { transaction: trans });
        await registrarBitacora({
            accion: 'RECUPERAR_PASSWORD',
            descripcion: JSON.stringify({ 
                previo: limpiarDatosUsuario(estadoPrevio), 
                posterior: limpiarDatosUsuario(user) 
            }),
            nivel_impacto: 'Alta',
            id_usuario: user.id_user
        }, { transaction: trans });

        await trans.commit();
        res.status(200).json({ mensaje: 'Contraseña restablecida con éxito.' });
    } catch (error) {
        await trans.rollback();
        res.status(500).json({ mensaje: 'Error interno del servidor.', error: error.message });
    }
};

const userEliminarCuenta = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const user = await User.findByPk(req.user.id_user, { transaction: trans });
        if (!user) {
            await trans.rollback();
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        const estadoPrevio = user.toJSON();
        user.estado = false;

        const datosDVH = {
            email: user.email,
            password_hash: user.password_hash,
            estado: false,
            id_empleado: user.id_empleado,
            intentos_fallidos: user.intentos_fallidos,
            bloqueado_hasta: user.bloqueado_hasta
        };
        user.dvh = calcularDVH(datosDVH);
        await user.save({ transaction: trans });

        await actualizarDVV(User, 'users', 'id_user', { transaction: trans });
        await registrarBitacora({
            accion: 'BAJA_LOGICA_CUENTA',
            descripcion: JSON.stringify({ 
                previo: limpiarDatosUsuario(estadoPrevio), 
                posterior: limpiarDatosUsuario(user) 
            }),
            nivel_impacto: 'Alta',
            id_usuario: user.id_user
        }, { transaction: trans });

        await trans.commit();
        res.status(200).json({ mensaje: 'Cuenta dada de baja correctamente.' });
    } catch (error) {
        await trans.rollback();
        res.status(500).json({ mensaje: 'Error interno del servidor.', error: error.message });
    }
};

module.exports = {
    login,
    registro,
    obtenerPerfil,
    actualizarEmail,
    actualizarPassword,
    recuperarPassword,
    userEliminarCuenta,
};