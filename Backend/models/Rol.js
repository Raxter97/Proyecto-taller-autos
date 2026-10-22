const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

//Luna

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
    tableName: 'rol', 
    timestamps: false 
});

module.exports = Rol;