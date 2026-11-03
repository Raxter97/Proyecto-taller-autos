const sequelize = require('../config/Database'); 
const Auto = require('../models/Auto');
const Cliente = require('../models/Cliente');
const Informe = require('../models/Informe');
const Empleado = require('../models/Empleado');
const Servicio = require('../models/Servicio');
const Repuesto = require('../models/Repuesto');
const { ServicioRealizado, RepuestoUsado } = require('../models/DetalleInforme');
const { calcularDVH } = require('../utils/CalculosDv');
const { actualizarDVV } = require('../utils/LogicaDvv');
const { registrarBitacora } = require('../services/BitacoraService');

const crearAuto = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const { patente, marca, modelo, email } = req.body;
        if (!patente || !marca || !modelo || !email) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Campos faltantes.' });
        }

        const cliente = await Cliente.findOne({ 
            where: { email }, 
            transaction: trans 
        });

        if (!cliente) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'El cliente no existe ' });
        }
        if (!cliente.estado) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'El cliente se encuentra inactivo' });
        }

        const autoExistente = await Auto.findOne({ 
            where: { patente }, transaction: trans 
        });
        if (autoExistente) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'La patente ya está registrada.' });
        }

        const datosDVH = {
            patente: patente.toUpperCase().trim(),
            marca,
            modelo,
            id_cliente: Number(cliente.id_cliente),
            estado: true
        };
        const dvh = calcularDVH(datosDVH);

        const nuevoAuto = await Auto.create({
            patente: patente.toUpperCase(),
            marca,
            modelo,
            id_cliente: Number(cliente.id_cliente),
            estado: true,
            dvh
        }, { transaction: trans });

        await actualizarDVV(Auto, 'autos', 'id_auto', { transaction: trans });

        await registrarBitacora({
            accion: 'INSERT_AUTO',
            descripcion: JSON.stringify({ auto: nuevoAuto }),
            nivel_impacto: 'Media',
            id_user: req.user.id_user
        }, { transaction: trans });

        await trans.commit();
        res.status(201).json({ mensaje: 'Vehículo registrado exitosamente'});
    } catch (error) {
        await trans.rollback();
        console.error("❌ ERROR DETALLADO EN CREAR AUTO:", error); //quitar
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ 
                mensaje: 'El registro ya existe o viola una restricción única.', 
                campo: error.errors[0]?.path 
            });
        }
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

const modificarAuto = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { patente, marca, modelo, estado } = req.body;

        const auto = await Auto.findByPk(id, { transaction: trans });
        if (!auto) {
            await trans.rollback();
            return res.status(404).json({ mensaje: 'Vehículo no encontrado.' });
        }

        const estadoPrevio = auto.toJSON();

        auto.patente = patente ?? auto.patente;
        auto.marca = marca ?? auto.marca;
        auto.modelo = modelo ?? auto.modelo;
        auto.estado = estado !== undefined ? estado : auto.estado;
        
        const datosDVH = {
            patente: auto.patente,
            marca: auto.marca,
            modelo: auto.modelo,
            id_cliente: Number(auto.id_cliente),
            estado: Boolean(auto.estado)
        };
        auto.dvh = calcularDVH(datosDVH);
        await auto.save({ transaction: trans });

        await actualizarDVV(Auto, 'autos', 'id_auto', { transaction: trans });

        await registrarBitacora({
            accion: 'UPDATE_AUTO',
            descripcion: JSON.stringify({ previo: estadoPrevio, posterior: auto.toJSON() }),
            nivel_impacto: 'Baja',
            id_user: req.user.id_user
        }, { transaction: trans });

        await trans.commit();
        res.status(200).json({ mensaje: 'Vehículo actualizado correctamente'});
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

const consultarHistorial = async (req, res) => {
    try {
        const { patente } = req.params;
        const auto = await Auto.findOne({ where: { patente } });
        if (!auto) {
            return res.status(404).json({ mensaje: 'Vehículo no encontrado.' });
        }

        const historial = await Informe.findAll({
            where: { id_auto: auto.id_auto },
            include: [
                { 
                    model: Empleado, 
                    attributes: ['legajo', 'nombre', 'apellido'] 
                },
                { 
                    model: ServicioRealizado, 
                    include: [
                        { 
                            model: Servicio, 
                            attributes: ['descripcion', 'precio'] 
                        }
                    ] 
                },
                { 
                    model: RepuestoUsado, 
                    include: [
                        { 
                            model: Repuesto, 
                            attributes: ['descripcion'] 
                        }
                    ] 
                }
            ],
            order: [['fecha', 'DESC']]
        });

        res.status(200).json({ 
            mensaje: 'Historial vehicular obtenido con éxito', 
            auto, 
            historial 
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

const consultarHistorialUser = async (req, res) => {
  try {

    const cliente = await Cliente.findOne({ 
        where: { email: req.user.email } 
    });

    if (!cliente) {
      return res.status(404).json({ mensaje: 'Perfil de cliente no encontrado.' });
    }

    const autos = await Auto.findAll({
      where: { id_cliente: cliente.id_cliente }
    });

    res.status(200).json({ autos });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al consultar tus vehículos.', error: error.message });
  }
};

const desactivarAuto = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const { id } = req.params;
        const auto = await Auto.findByPk(id, { transaction: trans });
        if (!auto) {
            await trans.rollback();
            return res.status(404).json({ mensaje: 'Vehículo no encontrado.' });
        }

        const estadoPrevio = auto.toJSON();
        auto.estado = false; 

        const datosDVH = {
            patente: auto.patente,
            marca: auto.marca,
            modelo: auto.modelo,
            id_cliente: Number(auto.id_cliente),
            estado: false
        };
        auto.dvh = calcularDVH(datosDVH);
        await auto.save({ transaction: trans });

        await actualizarDVV(Auto, 'autos', 'id_auto', { transaction: trans });
        await registrarBitacora({
            accion: 'BAJA_LOGICA_AUTO',
            descripcion: JSON.stringify({ previo: estadoPrevio, posterior: auto.toJSON() }),
            nivel_impacto: 'Alta',
            id_user: req.user.id_user
        }, { transaction: trans });

        await trans.commit();
        res.status(200).json({ mensaje: 'Vehículo dado de baja lógica correctamente' });
    } catch (error) {
        await trans.rollback();
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

module.exports = { crearAuto, modificarAuto, consultarHistorial, desactivarAuto, consultarHistorialUser };