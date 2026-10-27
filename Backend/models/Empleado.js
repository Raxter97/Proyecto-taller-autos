const {Sequelize, DataTypes} = require('sequelize');
const sequelize = require('../config/Database');


const Empleado = sequelize.define('Empleado',{
    id_empleado:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    legajo:{
        type:DataTypes.INTEGER,
        allowNull: false,
    },
    nombre: {
        type:DataTypes.STRING(50),
        allowNull: false,
    },
    apellido: {
        type:DataTypes.STRING(50),
        allowNull: false,
    },
    email:{
        type: DataTypes.STRING(100),
        unique:true,
        allowNull: false,
        validate: {isEmail: true}
    },
    sueldo_base:{
        type: DataTypes.DECIMAL(10,2),
        allowNull: false
    },
    disponibilidad: {
        type: DataTypes.STRING(15),
        allowNull: false,
        defaultValue:true
    },
    estado:{
        type: DataTypes.BOOLEAN,
        allowNull:false,
        defaultValue:true
    },
    dvh: {
        type: DataTypes.STRING(255),
        allowNull: false
    }
    
},{
    tableName: "empleados",
    timestamps: false
});

module.exports = Empleado;