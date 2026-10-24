const { DataTypes } = require('sequelize');
const sequelize = require('../config/Database');

const Factura = sequelize.define('Factura', {
    id_factura: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    fecha_emision: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    monto_total: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    estado: {
        type: DataTypes.STRING(15),
        allowNull: false,
        defaultValue: 'pendiente' 
    },
    dvh: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    id_informe: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, 
        references: { model: 'informes', key: 'id_informe' }
    }
}, {
    tableName: 'facturas',
    timestamps: false
});
Factura.belongsTo(Informe, { foreignKey: 'id_informe', as: 'informe' });

module.exports = Factura;