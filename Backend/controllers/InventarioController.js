const Repuesto = require('../models/Repuesto');
const Proveedor = require('../models/Proveedor');
const { registrarBitacora } = require('../services/BitacoraService');

// GESTIÓN REPUESTOS 

const obtenerRepuestos = async (req, res) => {
    try {
        const repuestos = await Repuesto.findAll();
        res.status(200).json({ repuestos });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener repuestos', error: error.message });
    }
};

const crearRepuesto = async (req, res) => {
    try {
        const { descripcion, stock } = req.body;
        if (!descripcion) {
            return res.status(400).json({ mensaje: 'La descripción del repuesto es obligatoria.' });
        }

        const nuevoRepuesto = await Repuesto.create({
            descripcion,
            stock: stock || 0,
            estado: true
        });

        await registrarBitacora({
            accion: 'INSERT_REPUESTO',
            descripcion: JSON.stringify({ repuesto_creado: nuevoRepuesto }),
            nivel_impacto: 'Media',
            id_usuario: req.user?.id_user || 1
        });

        res.status(201).json({ mensaje: 'Repuesto creado exitosamente', repuesto: nuevoRepuesto });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear repuesto', error: error.message });
    }
};

const actualizarRepuesto = async (req, res) => {
    try {
        const { id } = req.params;
        const { descripcion, stock } = req.body;

        const repuesto = await Repuesto.findByPk(id);
        if (!repuesto) return res.status(404).json({ mensaje: 'Repuesto no encontrado.' });

        const previo = repuesto.toJSON();
        if (descripcion !== undefined){
            repuesto.descripcion = descripcion;
        } 
        if (stock !== undefined){
            repuesto.stock = stock;
        } 
        await repuesto.save();

        await registrarBitacora({
            accion: 'UPDATE_REPUESTO',
            descripcion: JSON.stringify({ previo, posterior: repuesto.toJSON() }),
            nivel_impacto: 'Alta',
            id_usuario: req.user?.id_user || 1
        });

        res.status(200).json({ mensaje: 'Repuesto actualizado correctamente', repuesto });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar repuesto', error: error.message });
    }
};

const bajaRepuesto = async (req, res) => {
    try {
        const { id } = req.params;
        const repuesto = await Repuesto.findByPk(id);
        if (!repuesto) return res.status(404).json({ mensaje: 'Repuesto no encontrado.' });

        const previo = repuesto.toJSON();
        repuesto.estado = false; // Soft-delete
        await repuesto.save();

        await registrarBitacora({
            accion: 'DELETE_LOGICO_REPUESTO',
            descripcion: JSON.stringify({ previo, posterior: repuesto.toJSON() }),
            nivel_impacto: 'Alta',
            id_usuario: req.user?.id_user || 1
        });

        res.status(200).json({ mensaje: 'Repuesto dado de baja correctamente.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al dar de baja el repuesto', error: error.message });
    }
};

//  GESTIÓN PROVEEDORES 

const obtenerProveedores = async (req, res) => {
    try {
        const proveedores = await Proveedor.findAll();
        res.status(200).json({ proveedores });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener proveedores', error: error.message });
    }
};

const crearProveedor = async (req, res) => {
    try {
        const { razon_social, direccion, telefono } = req.body;
        if (!razon_social || !direccion || !telefono) {
            return res.status(400).json({ mensaje: 'Todos los campos del proveedor son obligatorios.' });
        }

        const existente = await Proveedor.findOne({ where: { razon_social } });
        if (existente) {
            return res.status(400).json({ mensaje: 'Ya existe un proveedor con esa Razón Social.' });
        }

        const nuevoProveedor = await Proveedor.create({ razon_social, direccion, telefono, estado: true });

        await registrarBitacora({
            accion: 'INSERT_PROVEEDOR',
            descripcion: JSON.stringify({ proveedor_creado: nuevoProveedor }),
            nivel_impacto: 'Media',
            id_usuario: req.user?.id_user || 1
        });

        res.status(201).json({ mensaje: 'Proveedor registrado exitosamente', proveedor: nuevoProveedor });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear proveedor', error: error.message });
    }
};

const actualizarProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        const { razon_social, direccion, telefono } = req.body;

        const proveedor = await Proveedor.findByPk(id);
        if (!proveedor) return res.status(404).json({ mensaje: 'Proveedor no encontrado.' });

        const previo = proveedor.toJSON();

        if (razon_social !== undefined) {
            const existente = await Proveedor.findOne({ where: { razon_social } });
            if (existente && existente.id_proveedor !== Number(id)) {
                return res.status(400).json({ mensaje: 'La razón social ya pertenece a otro proveedor.' });
            }
            proveedor.razon_social = razon_social;
        }
        if (direccion !== undefined) proveedor.direccion = direccion;
        if (telefono !== undefined) proveedor.telefono = telefono;

        await proveedor.save();

        await registrarBitacora({
            accion: 'UPDATE_PROVEEDOR',
            descripcion: JSON.stringify({ previo, posterior: proveedor.toJSON() }),
            nivel_impacto: 'Baja',
            id_usuario: req.user?.id_user || 1
        });

        res.status(200).json({ mensaje: 'Proveedor actualizado correctamente', proveedor });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar proveedor', error: error.message });
    }
};

const bajaProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        const proveedor = await Proveedor.findByPk(id);
        if (!proveedor) return res.status(404).json({ mensaje: 'Proveedor no encontrado.' });

        const previo = proveedor.toJSON();
        proveedor.estado = false;
        await proveedor.save();

        await registrarBitacora({
            accion: 'DELETE_LOGICO_PROVEEDOR',
            descripcion: JSON.stringify({ previo, posterior: proveedor.toJSON() }),
            nivel_impacto: 'Alta',
            id_usuario: req.user?.id_user || 1
        });

        res.status(200).json({ mensaje: 'Proveedor dado de baja correctamente.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al dar de baja proveedor', error: error.message });
    }
};

module.exports = {
    obtenerRepuestos,
    crearRepuesto,
    actualizarRepuesto,
    bajaRepuesto,
    obtenerProveedores,
    crearProveedor,
    actualizarProveedor,
    bajaProveedor
};