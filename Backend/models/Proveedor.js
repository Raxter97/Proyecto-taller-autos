const {Sequelize, DataTypes} = require('sequelize');
const sequelize = require('../config/database');

const Proveedor = sequelize.define('Proveedor',{
    id_proveedor:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    razon_social:{
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false
    },
    email:{
        type: DataTypes.STRING(100),
        unique:true,
        allowNull: false,
        validate: {isEmail: true}
    },
    telefono:{
        type: DataTypes.STRING(100),
        unique:true,
        allowNull: false,
    },
    dvh:{
        type: DataTypes.STRING(255),
        allowNull: false
    },
    estado:{
        type: DataTypes.BOOLEAN,
        allowNull:false,
        defaultValue:true
    },
    direccion:{
        type: DataTypes.STRING(100),
        allowNull:false,
    },
},{
    tableName: "Proveedor",
    timestamps: false
});

module.exports = Proveedor;