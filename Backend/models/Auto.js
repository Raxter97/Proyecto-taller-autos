const { DataTypes } = require('sequelize');
const sequelize = require('../config/Database');

const Auto = sequelize.define('Auto', {
    id_auto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    patente: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    marca: {
        type: DataTypes.STRING(30),
        allowNull: false
    },
    modelo: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    id_cliente: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'clientes',
            key: 'id_cliente'
        }
    }
}, {
    tableName: "autos",
    timestamps: false
});

module.exports = Auto;