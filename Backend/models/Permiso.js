const { DataTypes } = require('sequelize');
const sequelize = require('../config/Database');

const Permiso = sequelize.define('Permiso', {
    id_permiso: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true, 
        allowNull: false 
    },
    nombre_permiso: { 
        type: DataTypes.STRING(50), 
        unique: true, 
        allowNull: false 
    },
    dvh: { 
        type: DataTypes.STRING(255), 
        allowNull: false 
    },
    modulo: { 
        type: DataTypes.STRING(20), 
        allowNull: false
    },
}, { 
    tableName: 'permisos', 
    timestamps: false 
});

Permiso.belongsToMany(Rol, { through: 'rol_permiso', foreignKey: 'id_permiso', as: 'roles' });

module.exports = Permiso;

