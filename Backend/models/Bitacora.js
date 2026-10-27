const {Sequelize, DataTypes} = require('sequelize');
const sequelize = require('../config/Database');
const User = require('./User.models');

const Bitacora = sequelize.define('Bitacora',{
    id_bitacora:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement:true,
        allowNull: false
    },
    fecha_hora:{
        type:DataTypes.DATE,
        allowNull: false,
        defaultValue:DataTypes.NOW
    },
    accion:{
        type:DataTypes.STRING(50),
        allowNull:false
    },
    descripcion:{
        type:DataTypes.TEXT,
        allowNull:false
    },
    nivel_impacto:{
        type:DataTypes.ENUM('Baja','Media','Alta','Critica'),
        allowNull: false
    },
    dvh:{  
        type:DataTypes.STRING(255),
        allowNull:false
    },
    id_usuario:{
        type:DataTypes.INTEGER,
        allowNull: false
    }

},{
    tableName: "bitacora",
    timestamps: false
});
Bitacora.belongsTo(User, { foreignKey: 'id_usuario', as: 'usuario' });

module.exports = Bitacora;