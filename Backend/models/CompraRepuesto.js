const { DataTypes } = require('sequelize');
const sequelize = require('../config/Database');

const CompraRepuestos = sequelize.define('CompraRepuestos', {
    id_compra: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    total: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    estado: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'Pendiente' // O el valor por defecto que maneje tu sistema
    },
    id_proveedor: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { 
            model: 'proveedor', 
            key: 'id_proveedor' 
        }
    },
    dvh: {
        type: DataTypes.STRING(255),
        allowNull: false
    }
}, {
    tableName: 'compra_repuestos',
    timestamps: false
});

module.exports = CompraRepuestos