const sequelize = require('../config/Database');
const Factura = require('../models/Factura');
const Informe = require('../models/Informe');
const { ServicioRealizado, RepuestoUsado } = require('../models/DetallesInforme');
const catalogoServicio = require('../models/Servicio');
const Repuesto = require('../models/Repuesto');
const Parking = require('../models/Parking');
const { calcularDVH } = require('../utils/CalculosDv');
const { actualizarDVV } = require('../utils/LogicaDvv');
const { registrarBitacora } = require('../services/BitacoraService');


// CU-FAC-01: Generar Factura de Servicio consolidando el informe finalizado
const generarFactura = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const { id_informe } = req.body;
        if (!id_informe) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'El ID del informe es obligatorio.' });
        }

        const informe = await Informe.findByPk(
            id_informe, { transaction: trans }
        );
        if (!informe || informe.estado !== true) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'El informe técnico debe estar en estado "Finalizado" para facturar.' });
        }

        const facturaExistente = await Factura.findOne({ 
            where: { id_informe }, 
            transaction: trans 
        });
        if (facturaExistente) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Ya existe una factura emitida para este informe.' });
        }

        // Calcular total de servicios realizados
        const serviciosRealizados = await ServicioRealizado.findAll({ 
            where: { id_informe },
            transaction: trans 
        });
        let totalServicios = 0;
        for (const sr of serviciosRealizados) {
            const serv = await catalogoServicio.findByPk(
                sr.id_servicio, { transaction: trans }
            );
            if (serv){
                totalServicios += serv.precio;
            } 
        }

        // Calcular total de repuestos usados
        const repuestosUsados = await RepuestoUsado.findAll({ 
            where: { id_informe },
            transaction: trans 
        });
        let totalRepuestos = 0;
        for (const ru of repuestosUsados) {
            const rep = await Repuesto.findByPk(
                ru.id_repuesto, { transaction: trans }
            );
            if (rep){
                totalRepuestos += (rep.precio_venta || rep.costo || 0) * ru.cantidad;
            } 
        }

        const monto_total = totalServicios + totalRepuestos;
        const fecha_emision = new Date();
        const estado = 'pendiente';

        const datosDVH = {
            estado,
            fecha_emision: fecha_emision.toISOString(),
            id_informe: Number(id_informe),
            monto_total: Number(monto_total)
        };
        const dvh = calcularDVH(datosDVH);

        const nuevaFactura = await Factura.create({
            fecha_emision,
            monto_total,
            estado,
            dvh,
            id_informe: Number(id_informe)
        }, { transaction: trans });

        await actualizarDVV(Factura, 'facturas', 'id_factura', { transaction: trans });
        await registrarBitacora({
            accion: 'INSERT_FACTURA',
            descripcion: JSON.stringify({ posterior: nuevaFactura }),
            nivel_impacto: 'Alta',
            id_usuario: req.user.id_user
        }, { transaction: trans });

        await trans.commit();
        res.status(201).json({ mensaje: 'Factura generada exitosamente' });
    } catch (error) {
        await trans.rollback();
        res.status(500).json({ mensaje: 'Error al generar la factura', error: error.message });
    }
};

const registrarPago = async (req, res) => {
    const trans = await sequelize.transaction();
    try {
        const { id_factura } = req.params;
        const { medio_pago, cuotas, nro_cupon } = req.body; 

        if (!['Efectivo', 'Transferencia', 'Tarjeta'].includes(medio_pago)) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Medio de pago inválido.' });
        }

        const factura = await Factura.findByPk(
            id_factura,
            { transaction: trans }
        );
        if (!factura) {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Factura no encontrada' });
        }
        if (factura.estado === 'pagada') {
            await trans.rollback();
            return res.status(400).json({ mensaje: 'Factura ya pagada.' });
        }

        let montoFinal = factura.monto_total;

        if (medio_pago === 'Tarjeta') {
            if (!nro_cupon) {
                await trans.rollback();
                return res.status(400).json({ mensaje: 'El número del comprobante de la tarjeta es obligatorio.' });
            }
            const recargos = { 3: 1.10, 6: 1.20, 12: 1.35 };
            const coeficiente = recargos[cuotas] || 1.0; 
            montoFinal = factura.monto_total * coeficiente;
        }

        const estadoPrevio = factura.toJSON();
        factura.estado = 'pagada';
        factura.monto_total = Number(montoFinal.toFixed(2));

        const datosDVH = {
            estado: factura.estado,
            fecha_emision: factura.fecha_emision,
            id_informe: factura.id_informe,
            monto_total: factura.monto_total
        };
        factura.dvh = calcularDVH(datosDVH);
        await factura.save({ transaction: trans });

        await actualizarDVV(Factura, 'facturas', 'id_factura', { transaction: trans });

        // Liberar automáticamente la plaza al confirmar el pago total 
        const informe = await Informe.findByPk(
            factura.id_informe, 
            { transaction: trans }
        );
        if (informe) {
            const parking = await Parking.findOne({ 
                where: { id_auto: informe.id_auto, estado: true }, 
                transaction: trans 
            });
            if (parking) {
                parking.estado = false; 
                parking.id_auto = null;
                await parking.save({ transaction: trans });
            }
        }

        await registrarBitacora({
            accion: 'REGISTRAR_PAGO_INMEDIATO',
            descripcion: JSON.stringify({ 
                previo: estadoPrevio, 
                posterior: factura.toJSON(), 
                medio_pago, 
                cuotas: cuotas || 1,
                nro_cupon: nro_cupon || 'N/A'
            }),
            nivel_impacto: 'Alta',
            id_usuario: req.user.id_user
        }, { transaction: trans });

        await trans.commit();
        res.status(200).json({ 
            mensaje: 'Pago procesado. Vehículo habilitado para retiro.', 
            factura 
        });
    } catch (error) {
        await trans.rollback();
        res.status(500).json({ mensaje: 'Error al procesar el pago', error: error.message });
    }
};

module.exports = { generarFactura, registrarPago };