const { DataTypes } = require('sequelize');
const sequelize = require('../config/Database');
const {ServicioRealizado} = require('./DetalleInforme');

const Servicio = sequelize.define('Servicio', {
    id_servicio: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    precio: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    dvh: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'servicio',
    timestamps: false
});

Servicio.hasMany(ServicioRealizado, { foreignKey: 'id_servicio', as: 'serviciosRealizados' });

module.exports = Servicio;