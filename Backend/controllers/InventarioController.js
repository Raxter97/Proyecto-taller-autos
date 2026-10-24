const Repuesto = require('../models/Repuesto');
const Proveedor = require('../models/Proveedor');
const { registrarBitacora } = require('../services/BitacoraService');
const { CompraRepuestos, DetalleCompra } = require('../models/DetallesCompra'); // Ajusta la ruta de tu modelo si es distinta
const { calcularDVH } = require('../utils/CalculosDv');
const { actualizarDVV } = require('../utils/LogicaDvv');
const sequelize = require('../config/Database');

// GESTIÓN REPUESTOS 

const obtenerRepuestos = async (req, res) => {
    try {
        // Extraer parámetros de la URL 
        let { page = 1, limit = 50 } = req.query;
        
        page = parseInt(page);
        limit = parseInt(limit);

        if (limit > 50) {
            limit = 50;
        }
        if (page < 1) {
            page = 1;
        }

        // Calcular el desplazamiento (offset)
        const offset = (page - 1) * limit;

        const { count, rows: repuestos } = await Repuesto.findAndCountAll({
            limit,
            offset,
            order: [['id_repuesto', 'ASC']]
        });

        res.status(200).json({
            totalRegistros: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            pageSize: repuestos.length,
            repuestos
        });
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
        const stockInicial = Number(stock) || 0;

        const datosDVH = {
            descripcion,
            estado: true,
            stock: stockInicial
        };
        const dvh = calcularDVH(datosDVH);

        const nuevoRepuesto = await Repuesto.create({
            descripcion,
            stock: stockInicial,
            estado: true,
            dvh
        });
        await actualizarDVV(Repuesto, 'repuestos', 'id_repuesto');

        await registrarBitacora({
            accion: 'INSERT_REPUESTO',
            descripcion: JSON.stringify({ repuesto_creado: nuevoRepuesto }),
            nivel_impacto: 'Media',
            id_usuario: req.user?.id_user || 1
        });

        res.status(201).json({ mensaje: 'Repuesto creado exitosamente' });
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
        const datosDVH = {
            descripcion: repuesto.descripcion,
            estado: Boolean(repuesto.estado),
            stock: repuesto.stock
        };
        repuesto.dvh = calcularDVH(datosDVH);

        await repuesto.save();
        await actualizarDVV(Repuesto, 'repuestos', 'id_repuesto');

        await registrarBitacora({
            accion: 'UPDATE_REPUESTO',
            descripcion: JSON.stringify({ previo, posterior: repuesto.toJSON() }),
            nivel_impacto: 'Alta',
            id_usuario: req.user?.id_user || 1
        });

        res.status(200).json({ mensaje: 'Repuesto actualizado correctamente' });
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
        
        const datosDVH = {
            descripcion: repuesto.descripcion,
            estado: false,
            stock: repuesto.stock
        };
        repuesto.dvh = calcularDVH(datosDVH);

        await repuesto.save();
        await actualizarDVV(Repuesto, 'repuestos', 'id_repuesto');

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

const obtenerProveedores = async (_req, res) => {
    try {
        const proveedores = await Proveedor.findAll();
        res.status(200).json({ proveedores });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener proveedores', error: error.message });
    }
};

const crearProveedor = async (req, res) => {
    try {
        const { razon_social, direccion, telefono, email } = req.body;
        if (!razon_social || !direccion || !telefono || !email) {
            return res.status(400).json({ mensaje: 'Todos los campos del proveedor son obligatorios.' });
        }

        const existente = await Proveedor.findOne({ 
            where: { razon_social } 
        });
        if (existente) {
            return res.status(400).json({ mensaje: 'Ya existe un proveedor con esa Razón Social.' });
        }
        const datosDVH = { 
            razon_social, 
            direccion, 
            telefono, 
            email, 
            estado: true 
        };
        const dvh = calcularDVH(datosDVH);

        const nuevoProveedor = await Proveedor.create({ razon_social, direccion, telefono, email, estado: true, dvh });
        await actualizarDVV(Proveedor, 'proveedor', 'id_proveedor');
        
        await registrarBitacora({
            accion: 'INSERT_PROVEEDOR',
            descripcion: JSON.stringify({ proveedor_creado: nuevoProveedor }),
            nivel_impacto: 'Media',
            id_usuario: req.user?.id_user || 1
        });

        res.status(201).json({ mensaje: 'Proveedor registrado exitosamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear proveedor', error: error.message });
    }
};

const actualizarProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        const { razon_social, direccion, telefono, email } = req.body;

        const proveedor = await Proveedor.findByPk(id);
        if (!proveedor){
            return res.status(404).json({ mensaje: 'Proveedor no encontrado.' });
        } 
        
        if (razon_social !== undefined && razon_social !== proveedor.razon_social) {
            const existente = await Proveedor.findOne({ 
                where: { razon_social } 
            });
            if (existente && existente.id_proveedor !== Number(id)) {
                return res.status(400).json({ mensaje: 'La razón social ya pertenece a otro proveedor.' });
            }
        }

        const previo = proveedor.toJSON();
        if (razon_social !== undefined){
            proveedor.razon_social = razon_social;
        }
        if (direccion !== undefined){
            proveedor.direccion = direccion;
        }
        if (telefono !== undefined){
            proveedor.telefono = telefono;
        }
        if (email !== undefined){
            proveedor.email = email;
        }
        
        const datosDVH = {
            razon_social: proveedor.razon_social,
            direccion: proveedor.direccion,
            telefono: proveedor.telefono,
            email: proveedor.email,
            estado: Boolean(proveedor.estado)
        };
        proveedor.dvh = calcularDVH(datosDVH);
                
        await proveedor.save();
        await actualizarDVV(Proveedor, 'proveedor', 'id_proveedor');
        
        await registrarBitacora({
            accion: 'UPDATE_PROVEEDOR',
            descripcion: JSON.stringify({ previo, posterior: proveedor.toJSON() }),
            nivel_impacto: 'Baja',
            id_usuario: req.user?.id_user || 1
        });

        res.status(200).json({ mensaje: 'Proveedor actualizado correctamente' });
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

        const datosDVH = {
            razon_social: proveedor.razon_social,
            direccion: proveedor.direccion,
            telefono: proveedor.telefono,
            email: proveedor.email,
            estado: false
        };
        proveedor.dvh = calcularDVH(datosDVH);

        await proveedor.save();

        await actualizarDVV(Proveedor, 'proveedor', 'id_proveedor');

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

// COMPRAS Y RECEPCIÓN DE MERCADERÍA

const registrarOrdenCompra = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const { id_proveedor, items } = req.body; 
        // items: [{ id_repuesto, cantidad, costo_unitario }]

        if (!id_proveedor || !items || !items.length) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Proveedor e ítems de compra son obligatorios.' });
        }

        const proveedor = await Proveedor.findByPk(
            id_proveedor, 
            { transaction: trans }
        );
        
        if (!proveedor ) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Proveedor inválido' });
        }
        if (!proveedor.estado) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Proveedor inactivo.' });
        }

        let total = 0;
        for (const item of items) {
            total += Number(item.cantidad) * Number(item.costo_unitario);
        }

        const fecha = new Date().toISOString().split('T')[0];

        const datosDVH = {
            fecha,
            id_proveedor: Number(id_proveedor),
            total: Number(total)
        };
        const dvh = calcularDVH(datosDVH);

        const nuevaCompra = await CompraRepuestos.create({
            fecha,
            total,
            id_proveedor: Number(id_proveedor),
            dvh
        }, { transaction: trans });

        for (const item of items) {
            await DetalleCompra.create({
                id_compra: nuevaCompra.id_compra,
                id_repuesto: Number(item.id_repuesto),
                cantidad: Number(item.cantidad),
                costo_unitario: Number(item.costo_unitario)
            }, { transaction: trans });
        }

        await actualizarDVV(CompraRepuestos, 'compra_repuestos', 'id_compra');
        await registrarBitacora({
            accion: 'INSERT_ORDEN_COMPRA',
            descripcion: JSON.stringify({ id_compra: nuevaCompra.id_compra, total, items }),
            nivel_impacto: 'Alta',
            id_usuario: req.user?.id_user || 1
        });

        await trans.commit();
        res.status(201).json({ mensaje: 'Orden de compra registrada con éxito' });
    } catch (error) {
        await trans.rollback();
        res.status(500).json({ mensaje: 'Error al registrar orden de compra', error: error.message });
    }
};

const confirmarRecepcionMercaderia = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const { id_compra } = req.params;

        const compra = await CompraRepuestos.findByPk(
            id_compra, 
            { transaction: trans }
        );
        if (!compra) {
            await trans.rollback();
            return res.status(404).json({ mensaje: 'Orden de compra no encontrada.' });
        }

        const recepcionRegistrada = await registrarBitacora.findOne ? null : null; 

        const detalles = await DetalleCompra.findAll({ 
            where: { id_compra }, 
            transaction: trans 
        });

        for (const detalle of detalles) {
            const repuesto = await Repuesto.findByPk(
                detalle.id_repuesto, 
                { transaction: trans }
            );
            if (repuesto) {
                repuesto.stock += Number(detalle.cantidad);
                
                const datosDVH = {
                    descripcion: repuesto.descripcion,
                    estado: Boolean(repuesto.estado),
                    stock: repuesto.stock
                };
                repuesto.dvh = calcularDVH(datosDVH);

                await repuesto.save({ transaction: trans });
            }
        }
        await actualizarDVV(Repuesto, 'repuestos', 'id_repuesto');

        await registrarBitacora({
            accion: 'RECEPCION_MERCADERIA',
            descripcion: JSON.stringify({ id_compra, estado: 'Recibida' }),
            nivel_impacto: 'Alta',
            id_usuario: req.user?.id_user || 1
        });

        await trans.commit();
        res.status(200).json({ mensaje: 'Recepción de mercadería confirmada. Stock actualizado correctamente.' });
    } catch (error) {
        await trans.rollback();
        res.status(500).json({ mensaje: 'Error al confirmar recepción de mercadería', error: error.message });
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
    bajaProveedor,
    registrarOrdenCompra,
    confirmarRecepcionMercaderia
};