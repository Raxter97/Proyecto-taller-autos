const { DataTypes } = require('sequelize');
const sequelize = require('../config/Database');

const UserRol = sequelize.define('UserRol', {
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
        primaryKey: true, 
        allowNull: false 
    },
    id_user: { 
        type: DataTypes.INTEGER, 
        primaryKey: true,
        allowNull: false 
    }
}, { 
    tableName: 'user_rol', 
    timestamps: false 
});

module.exports = UserRol;