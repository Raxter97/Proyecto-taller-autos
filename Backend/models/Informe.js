const { DataTypes } = require('sequelize');
const sequelize = require('../config/Database');

const Informe = sequelize.define('Informe', {
    id_informe: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false // False = 'En Proceso', True = 'Finalizado'
    },
    dvh: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    id_auto: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { 
            model: 'autos', 
            key: 'id_auto' 
        }
    },
    id_empleado: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { 
            model: 'empleados', 
            key: 'id_empleado' 
        }
    }
}, {
    tableName: 'informes',
    timestamps: false
});

module.exports = Informe;