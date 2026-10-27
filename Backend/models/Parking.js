const { DataTypes } = require('sequelize');
const sequelize = require('../config/Database');

const Parking = sequelize.define('Parking', {
    id_parking: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nro_lugar: {
        type: DataTypes.INTEGER,
        unique: true,
        allowNull: false
    },
    estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false // FALSE = "libre", TRUE = "ocupado"
    },
    id_auto: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'autos',
            key: 'id_auto'
        }
    }
}, {
    tableName: 'parking',
    timestamps: false
});

module.exports = Parking;
