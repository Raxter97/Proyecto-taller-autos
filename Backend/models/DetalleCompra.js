const { DataTypes } = require('sequelize');
const sequelize = require('../config/Database');

const DetalleCompra = sequelize.define('DetalleCompra', {
    id_detalle_compra: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    costo_unitario: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    id_compra: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'compra_repuestos', 
            key: 'id_compra' 
        }
    },
    id_repuesto: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'repuestos', 
            key: 'id_repuesto' 
        }
    }
}, {
    tableName: 'detalle_compra',
    timestamps: false
});

module.exports = DetalleCompra;