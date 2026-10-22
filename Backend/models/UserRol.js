const { DataTypes } = require('sequelize');
const sequelize = require('../config/Database');

const UserRol = sequelize.define('UserRol', {
    id_usuario_rol: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true, 
        allowNull: false 
    },
    dvh: { 
        type: DataTypes.STRING(255), 
        allowNull: false 
    },
    fecha_asignacion: { 
        type: DataTypes.DATE, 
        allowNull: false, 
        defaultValue: DataTypes.NOW 
    },
    id_rol: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    },
    id_usuario: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    }
}, { 
    tableName: 'user_rol', 
    timestamps: false 
});

module.exports = UserRol;