const { DataTypes } = require('sequelize');
const sequelize = require('../config/Database');
const User = require('./User.models');
const Permiso = require('./Permiso');


const Rol = sequelize.define('Rol', {
    id_rol: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true, 
        allowNull: false 
    },
    nombre_rol: { 
        type: DataTypes.STRING(50), 
        unique: true, 
        allowNull: false 
    },
    descripcion: { 
        type: DataTypes.TEXT, 
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
    },
}, { 
    tableName: 'roles', 
    timestamps: false 
});
Rol.belongsToMany(User, { through: 'usuario_rol', foreignKey: 'id_rol', otherKey: 'id_usuario', as: 'usuarios' });
Rol.belongsToMany(Permiso, { through: 'rol_permiso', foreignKey: 'id_rol', otherKey: 'id_permiso', as: 'permisos' });

module.exports = Rol;