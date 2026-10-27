const { DataTypes } = require('sequelize');
const sequelize = require('../config/Database');

const Turno = sequelize.define('Turno', {
    id_turno: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true, 
        allowNull: false 
    },
    fecha_hora: { 
        type: DataTypes.DATE, 
        allowNull: false 
    },
    estado: { 
        type: DataTypes.STRING(20), 
        allowNull: false, 
        defaultValue: 'Agendado' //Estados: 'Agendado', 'Confirmado', 'Atendido', 'Cancelado'
    },
    id_cliente: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: {
            model: Cliente,
            key: 'id_cliente'
        }
    },
    id_auto: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: {
            model: Auto,
            key: 'id_auto'
        }
    }
}, { 
    tableName: 'turnos', 
    timestamps: false 
});


module.exports = Turno;