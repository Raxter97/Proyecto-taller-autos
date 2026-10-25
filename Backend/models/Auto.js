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
    dvh: {
        type: DataTypes.STRING(255),
        allowNull: false
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

Auto.belongsTo(Cliente, { foreignKey: 'id_cliente', as: 'cliente' });
Auto.hasMany(Informe, { foreignKey: 'id_auto', as: 'informes' });
Auto.hasMany(Turno, { foreignKey: 'id_auto', as: 'turnos' });
Auto.hasOne(Parking, { foreignKey: 'id_auto', as: 'parking' });

module.exports = Auto;