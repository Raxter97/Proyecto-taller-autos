const Auto = require('../models/Auto');
const Cliente = require('../models/Cliente');
const Informe = require('../models/Informe');
const Empleado = require('../models/Empleado');
const Servicio = require('../models/Servicio');
const Repuesto = require('../models/Repuesto');
const { ServicioRealizado, RepuestoUsado } = require('../models/DetallesInforme');
const { calcularDVH } = require('../utils/CalculosDv');
const { actualizarDVV } = require('../utils/LogicaDvv');
const { registrarBitacora } = require('../services/BitacoraService');

const crearAuto = async (req, res) => {
    try {
        const { patente, marca, modelo, id_cliente } = req.body;
        if (!patente || !marca || !modelo || !id_cliente) {
            return res.status(400).json({ mensaje: 'Campos faltantes.' });
        }

        const cliente = await Cliente.findByPk(id_cliente);
        if (!cliente) {
            return res.status(400).json({ mensaje: 'El cliente no existe ' });
        }
        if (!cliente.estado) {
            return res.status(400).json({ mensaje: 'El cliente se encuentra inactivo' });
        }

        const autoExistente = await Auto.findOne({ where: { patente } });
        if (autoExistente) {
            return res.status(400).json({ mensaje: 'La patente ya está registrada.' });
        }
        const datosDVH = {
            patente: patente.toUpperCase(),
            marca,
            modelo,
            id_cliente: Number(id_cliente),
            estado: true
        };
        const dvh = calcularDVH(datosDVH);

        const nuevoAuto = await Auto.create({
            patente: patente.toUpperCase(),
            marca,
            modelo,
            id_cliente: Number(id_cliente),
            estado: true,
            dvh
        });

        await actualizarDVV(Auto, 'autos', 'id_auto');

        await registrarBitacora({
            accion: 'INSERT_AUTO',
            descripcion: JSON.stringify({ auto: nuevoAuto }),
            nivel_impacto: 'Media',
            id_usuario: req.user?.id_user || 1
        });

        res.status(201).json({ mensaje: 'Vehículo registrado exitosamente'});
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

const modificarAuto = async (req, res) => {
    try {
        const { id } = req.params;
        const { patente, marca, modelo, estado } = req.body;

        const auto = await Auto.findByPk(id);
        if (!auto) {
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
        await auto.save();

        await actualizarDVV(Auto, 'autos', 'id_auto');

        await registrarBitacora({
            accion: 'UPDATE_AUTO',
            descripcion: JSON.stringify({ previo: estadoPrevio, posterior: auto.toJSON() }),
            nivel_impacto: 'Baja',
            id_usuario: req.user?.id_user || 1
        });

        res.status(200).json({ mensaje: 'Vehículo actualizado correctamente'});
    } catch (error) {
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

        // Consultar el historial completo cruzando con informes, empleados, servicios y repuestos
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

module.exports = { crearAuto, modificarAuto, consultarHistorial };