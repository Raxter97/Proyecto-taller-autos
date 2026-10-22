const Cliente = require('../models/Cliente');
const { calcularDVH } = require('../utils/CalculosDv');
const { actualizarDVV } = require('../utils/KogicaDvv');
const { registrarBitacora } = require('../services/BitacoraService');
//Luna
const crearCliente = async (req, res) => {
    try {
        const { dni, nombre, apellido, email, telefono, direccion } = req.body;
        if (!dni || !nombre || !apellido || !email || !telefono) {
            return res.status(400).json({ mensaje: 'Campos obligatorios faltantes.' });
        }

        const clienteExistente = await Cliente.findOne({ 
            where: { dni } 
        });
        if (clienteExistente) {
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
        });

        await actualizarDVV(Cliente, 'clientes', 'id_cliente');
        await registrarBitacora({
            accion: 'INSERT_CLIENTE',
            descripcion: JSON.stringify({ cliente: nuevoCliente }),
            nivel_impacto: 'Media',
            id_usuario: req.user?.id_user || 1
        });

        res.status(201).json({ mensaje: 'Cliente registrado exitosamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

const modificarCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { dni, nombre, apellido, email, telefono, direccion, estado } = req.body;

        const cliente = await Cliente.findByPk(id);
        if (!cliente) {
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
        await cliente.save();

        await actualizarDVV(Cliente, 'clientes', 'id_cliente');
        await registrarBitacora({
            accion: 'UPDATE_CLIENTE',
            descripcion: JSON.stringify({ previo: estadoPrevio, posterior: cliente.toJSON() }),
            nivel_impacto: 'Media',
            id_usuario: req.user?.id_user || 1
        });

        res.status(200).json({ mensaje: 'Cliente actualizado correctamente', cliente });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

const desactivarCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const cliente = await Cliente.findByPk(id);
        if (!cliente) {
            return res.status(404).json({ mensaje: 'Cliente no encontrado.' });
        }

        const estadoPrevio = cliente.toJSON();
        cliente.estado = false; // Baja lógica

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
        await cliente.save();

        await actualizarDVV(Cliente, 'clientes', 'id_cliente');
        await registrarBitacora({
            accion: 'BAJA_LOGICA_CLIENTE',
            descripcion: JSON.stringify({ previo: estadoPrevio, posterior: cliente.toJSON() }),
            nivel_impacto: 'Alta',
            id_usuario: req.user?.id_user || 1
        });

        res.status(200).json({ mensaje: 'Cliente dado de baja lógica correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

module.exports = { crearCliente, modificarCliente, desactivarCliente };