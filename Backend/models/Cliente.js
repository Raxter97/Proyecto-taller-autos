const {Sequelize, DataTypes} = require('sequelize');
const sequelize = require('../config/Database');


const Cliente = sequelize.define('Cliente',{
    nombre: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    apellido: {
        type:DataTypes.STRING(50),
        allowNull: false,
    },
    id_cliente: {
        type:DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    dni: {
        type:DataTypes.INTEGER,
        allowNull: false,
        unique: true,
    },
    email:{
        type:DataTypes.STRING(100),
        allowNull:false,
        unique: true,
        validate: {isEmail: true}
    },
    telefono:{
        type:DataTypes.STRING(20),
        allowNull: false,
    },
    direccion:{
        type:DataTypes.STRING(100),
        allowNull: true,
    },
    estado:{
        type: DataTypes.BOOLEAN,
        allowNull:false,
        defaultValue: true
    },
},{
    tableName: "clientes",
    timestamps: false
});

module.exports = Cliente;