const {DataTypes} = require('sequelize');
const sequelize = require('../config/Database');


const User = sequelize.define('User',{
    id_user:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    email:{
        type: DataTypes.STRING(100),
        unique:true,
        allowNull: false,
        validate: {
            isEmail: {
                msg: 'El email es inválido.'
            },
            dominioValido(value) {
                const extension = value.split('.').pop();
                if (!extension || extension.length < 2) {
                    throw new Error('La extensión del dominio no es válida.');
                }
            }
        },
    },
    password_hash:{
        type: DataTypes.STRING(255),
        allowNull:false
    },
    dvh:{
        type: DataTypes.STRING(255),
        allowNull: false
    },
    estado:{
        type: DataTypes.BOOLEAN,
        allowNull:false,
        defaultValue: true
    },
    id_empleado:{
        type: DataTypes.INTEGER,
        allowNull:true, //cambiar a false en otro momento
        unique:true
    },
},{
    tableName: "users",
    timestamps: false
});

User.belongsToMany(Rol, { through: 'usuario_rol', foreignKey: 'id_usuario', as: 'roles' });

module.exports = User;