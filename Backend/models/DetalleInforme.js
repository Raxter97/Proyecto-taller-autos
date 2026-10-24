const { DataTypes } = require('sequelize');
const sequelize = require('../config/Database');

const RepuestoUsado = sequelize.define('RepuestoUsado', {
    id_repuesto_usado: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_repuesto: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_informe: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'repuestos_usados',
    timestamps: false
});
RepuestoUsado.belongsTo(Informe, { foreignKey: 'id_informe', as: 'informe' });
RepuestoUsado.belongsTo(Repuesto, { foreignKey: 'id_repuesto', as: 'repuesto' });

const ServicioRealizado = sequelize.define('ServicioRealizado', {
    id_servicio_realizado: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    id_informe: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_servicio: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'servicios_realizados',
    timestamps: false
});
ServicioRealizado.belongsTo(Informe, { foreignKey: 'id_informe', as: 'informe' });
ServicioRealizado.belongsTo(Servicio, { foreignKey: 'id_servicio', as: 'servicio' });

module.exports = { RepuestoUsado, ServicioRealizado };