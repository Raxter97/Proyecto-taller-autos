const Cliente = require('../models/Cliente');
const Turno = require('../models/Turno');
const Auto = require('../models/Auto');
const Informe = require('../models/Informe');
const Factura = require('../models/Factura');
const { calcularDVH } = require('../utils/CalculosDv');
const { actualizarDVV } = require('../utils/LogicaDvv');
const { registrarBitacora } = require('../services/BitacoraService');

const crearCliente = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const { dni, nombre, apellido, email, telefono, direccion } = req.body;
        if (!dni || !nombre || !apellido || !email || !telefono) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Campos obligatorios faltantes.' });
        }

        const clienteExistente = await Cliente.findOne({ 
            where: { dni },
            transaction: trans 
        });
        if (clienteExistente) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'El DNI ya pertenece a un cliente activo.' });
        }
        const datosDVH = {
            apellido,
            direccion: direccion || '',
            dni: Number(dni),
            email,
            estado: true,
            nombre,
            telefono
        };
        const dvh = calcularDVH(datosDVH);

        const nuevoCliente = await Cliente.create({
            dni,
            nombre,
            apellido,
            email,
            telefono,
            direccion,
            estado: true,
            dvh
        }, { transaction: trans });

        await actualizarDVV(Cliente, 'clientes', 'id_cliente', { transaction: trans });
        await registrarBitacora({
            accion: 'INSERT_CLIENTE',
            descripcion: JSON.stringify({ cliente: nuevoCliente }),
            nivel_impacto: 'Media',
            id_usuario: req.user.id_user
        }, { transaction: trans });

        await trans.commit();
        res.status(201).json({ mensaje: 'Cliente registrado exitosamente' });
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

const modificarCliente = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { dni, nombre, apellido, email, telefono, direccion, estado } = req.body;

        const cliente = await Cliente.findByPk(id, { transaction: trans });
        if (!cliente) {
            await trans.rollback();
            return res.status(404).json({ mensaje: 'Cliente no encontrado.' });
        }

        const estadoPrevio = cliente.toJSON();

        cliente.dni = dni ?? cliente.dni;
        cliente.nombre = nombre ?? cliente.nombre;
        cliente.apellido = apellido ?? cliente.apellido;
        cliente.email = email ?? cliente.email;
        cliente.telefono = telefono ?? cliente.telefono;
        cliente.direccion = direccion ?? cliente.direccion;
        cliente.estado = estado !== undefined ? estado : cliente.estado;

        const datosDVH = {
            apellido: cliente.apellido,
            direccion: cliente.direccion || '',
            dni: Number(cliente.dni),
            email: cliente.email,
            estado: Boolean(cliente.estado),
            nombre: cliente.nombre,
            telefono: cliente.telefono
        };
        cliente.dvh = calcularDVH(datosDVH);
        await cliente.save({ transaction: trans });
        await actualizarDVV(Cliente, 'clientes', 'id_cliente', { transaction: trans });
        await registrarBitacora({
            accion: 'UPDATE_CLIENTE',
            descripcion: JSON.stringify({ previo: estadoPrevio, posterior: cliente.toJSON() }),
            nivel_impacto: 'Media',
            id_usuario: req.user.id_user
        }, { transaction: trans });

        await trans.commit();

        res.status(200).json({ mensaje: 'Cliente actualizado correctamente', cliente });
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

const desactivarCliente = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const { id } = req.params;
        const cliente = await Cliente.findByPk(
            id, { transaction: trans }
        );
        if (!cliente) {
            await trans.rollback();
            return res.status(404).json({ mensaje: 'Cliente no encontrado.' });
        }

        const turnosActivos = await Turno.findOne({
            where: { id_cliente: id, estado: ['Agendado', 'Confirmado'] },
            transaction: trans
        });
        if (turnosActivos) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'No se puede dar de baja: el cliente posee turnos activos en la agenda.' });
        }

        const autosCliente = await Auto.findAll({ 
            where: { id_cliente: id },
            transaction: trans 
        });
        const autoIds = autosCliente.map(a => a.id_auto);

        if (autoIds.length > 0) {
            const informeEnProceso = await Informe.findOne({
                where: { 
                    id_auto: autoIds, 
                    estado: false
                }, transaction: trans
            });
            if (informeEnProceso) {
                await trans.rollback();
                return res.status(400).json({ mensaje: 'No se puede dar de baja: el cliente tiene vehículos con reparaciones abiertas en el taller.' });
            }

            const informesCliente = await Informe.findAll({ 
                where: { id_auto: autoIds },
                transaction: trans
            });
            const informeIds = informesCliente.map(i => i.id_informe);

            if (informeIds.length > 0) {
                const facturaPendiente = await Factura.findOne({
                    where: { 
                        id_informe: informeIds, 
                        estado: 'pendiente' 
                    },transaction: trans
                });
                if (facturaPendiente) {
                    await trans.rollback();
                    return res.status(400).json({ mensaje: 'No se puede dar de baja: el cliente posee facturas pendientes de pago.' });
                }
            }
        }

        const estadoPrevio = cliente.toJSON();
        cliente.estado = false; 

        const datosDVH = {
            apellido: cliente.apellido,
            direccion: cliente.direccion || '',
            dni: Number(cliente.dni),
            email: cliente.email,
            estado: false,
            nombre: cliente.nombre,
            telefono: cliente.telefono
        };
        cliente.dvh = calcularDVH(datosDVH);
        await cliente.save({ transaction: trans });

        await actualizarDVV(Cliente, 'clientes', 'id_cliente', { transaction: trans });
        await registrarBitacora({
            accion: 'BAJA_LOGICA_CLIENTE',
            descripcion: JSON.stringify({ previo: estadoPrevio, posterior: cliente.toJSON() }),
            nivel_impacto: 'Alta',
            id_usuario: req.user.id_user
        }, { transaction: trans });

        await trans.commit();
        res.status(200).json({ mensaje: 'Cliente dado de baja lógica correctamente' });
    } catch (error) {
        await trans.rollback();
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

module.exports = { crearCliente, modificarCliente, desactivarCliente };