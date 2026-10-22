const { DataTypes } = require('sequelize');
const sequelize = require('../config/Database');
//Luna
const AuditoriaDvv = sequelize.define('AuditoriaDvv', {
    id_auditoria: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    tabla_afectada: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false
    },
    dvv: {
        type: DataTypes.STRING(64),
        allowNull: false
    },
    ultima_actualizacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'auditoria_dvv',
    timestamps: false
});

module.exports = AuditoriaDvv;