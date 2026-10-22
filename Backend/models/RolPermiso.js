const { DataTypes } = require('sequelize');
const sequelize = require('../config/Database');

const RolPermiso = sequelize.define('RolPermiso', {
    id_rol_permiso: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true, 
        allowNull: false 
    },
    dvh: { 
        type: DataTypes.STRING(255), 
        allowNull: false 
    },
    id_permiso: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    },
    id_rol: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    }
}, { 
    tableName: 'rol_permiso', 
    timestamps: false 
});

module.exports = RolPermiso;