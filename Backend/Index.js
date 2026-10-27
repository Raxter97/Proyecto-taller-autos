const app = require('./App');
const sequelize = require('./config/Database');
const PORT = process.env.PORT || 5000;

require('./models/User.models');
require('./models/Cliente');
require('./models/Empleado');
require('./models/Auto');
require('./models/Rol');
require('./models/Permiso');
require('./models/RolPermiso');
require('./models/UserRol');
require('./models/Turno');
require('./models/Bitacora');
require('./models/AuditoriaDvv');
require('./models/Parking');
require('./models/Repuesto');
require('./models/Servicio'); 
require('./models/Proveedor');
require('./models/Informe');
require('./models/Factura'); 
require('./models/DetallesInforme'); 
require('./models/CompraRepuestos'); 
require('./models/DetalleCompra'); 

const { User, Permiso, Parking, Servicio, Repuesto, Rol, ServicioRealizado, RepuestoUsado, Bitacora, Cliente, Empleado, Auto, Turno, CompraRepuestos, DetalleCompra, Proveedor, Informe, Factura } = sequelize.models;

Auto.belongsTo(Cliente, { foreignKey: 'id_cliente', as: 'cliente' });
Auto.hasMany(Informe, { foreignKey: 'id_auto', as: 'informes' });
Auto.hasMany(Turno, { foreignKey: 'id_auto', as: 'turnos' });
Auto.hasOne(Parking, { foreignKey: 'id_auto', as: 'parking' });

Bitacora.belongsTo(User, { foreignKey: 'id_usuario', as: 'usuario' });

Cliente.hasMany(Auto, { foreignKey: 'id_cliente', as: 'autos' });
Cliente.hasMany(Turno, { foreignKey: 'id_cliente', as: 'turnos' });

CompraRepuestos.belongsTo(Proveedor, { foreignKey: 'id_proveedor', as: 'proveedor' });
CompraRepuestos.hasMany(DetalleCompra, { foreignKey: 'id_compra', as: 'detalles' });

DetalleCompra.belongsTo(CompraRepuestos, { foreignKey: 'id_compra', as: 'compra' });
DetalleCompra.belongsTo(Repuesto, { foreignKey: 'id_repuesto', as: 'repuesto' });

RepuestoUsado.belongsTo(Informe, { foreignKey: 'id_informe', as: 'informe' });
RepuestoUsado.belongsTo(Repuesto, { foreignKey: 'id_repuesto', as: 'repuesto' });

ServicioRealizado.belongsTo(Informe, { foreignKey: 'id_informe', as: 'informe' });
ServicioRealizado.belongsTo(Servicio, { foreignKey: 'id_servicio', as: 'servicio' });

Empleado.hasOne(User, { foreignKey: 'id_empleado', as: 'usuario' });
Empleado.hasMany(Informe, { foreignKey: 'id_empleado', as: 'informes' });

Factura.belongsTo(Informe, { foreignKey: 'id_informe', as: 'informe' });

Informe.belongsTo(Auto, { foreignKey: 'id_auto', as: 'auto' });
Informe.belongsTo(Empleado, { foreignKey: 'id_empleado', as: 'empleado' });
Informe.hasOne(Factura, { foreignKey: 'id_informe', as: 'factura' });
Informe.hasMany(RepuestoUsado, { foreignKey: 'id_informe', as: 'repuestosUsados' });
Informe.hasMany(ServicioRealizado, { foreignKey: 'id_informe', as: 'serviciosRealizados' });

Parking.belongsTo(Auto, { foreignKey: 'id_auto', as: 'auto' });

Permiso.belongsToMany(Rol, { through: 'rol_permiso', foreignKey: 'id_permiso', otherKey: 'id_rol', as: 'roles' });

Proveedor.hasMany(CompraRepuestos, { foreignKey: 'id_proveedor', as: 'compras' });

Repuesto.hasMany(RepuestoUsado, { foreignKey: 'id_repuesto', as: 'repuestosUsados' });
Repuesto.hasMany(DetalleCompra, { foreignKey: 'id_repuesto', as: 'detallesCompra' });

Servicio.hasMany(ServicioRealizado, { foreignKey: 'id_servicio', as: 'serviciosRealizados' });

Rol.belongsToMany(User, { through: 'usuario_rol', foreignKey: 'id_rol', otherKey: 'id_usuario', as: 'usuarios' });
Rol.belongsToMany(Permiso, { through: 'rol_permiso', foreignKey: 'id_rol', otherKey: 'id_permiso', as: 'permisos' });

Turno.belongsTo(Cliente, { foreignKey: 'id_cliente', as: 'cliente' });
Turno.belongsTo(Auto, { foreignKey: 'id_auto', as: 'auto' });

User.belongsTo(Empleado, { foreignKey: 'id_empleado', as: 'empleado' });
User.belongsToMany(Rol, { through: 'usuario_rol', foreignKey: 'id_usuario', otherKey: 'id_rol', as: 'roles' });


async function main() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida.');

    await sequelize.sync({ force: false });
    console.log('Sincronización de modelos completada.');
    
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
  }
}

main();