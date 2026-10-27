const { DataTypes } = require('sequelize');
const sequelize = require('../config/Database');
const DetalleCompra = require('./DetalleCompra');
const {RepuestoUsado}  = require('./DetalleInforme');

const Repuesto = sequelize.define('Repuesto', {
    id_repuesto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true 
    }
}, {
    tableName: 'repuestos',
    timestamps: false
});
Repuesto.hasMany(RepuestoUsado, { foreignKey: 'id_repuesto', as: 'repuestosUsados' });
Repuesto.hasMany(DetalleCompra, { foreignKey: 'id_repuesto', as: 'detallesCompra' });

module.exports = Repuesto;