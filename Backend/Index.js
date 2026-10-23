const app = require('./app');
const sequelize = require('./config/Database');
const PORT = process.env.PORT || 5000;


require('./models/User.models');
require('./models/Cliente');
require('./models/Empleado');
require('./models/Auto');
require('./models/Rol');
require('./models/Permiso');
require('./models/RolPermiso');
require('./models/UsuarioRol');
require('./models/Turno');
require('./models/Bitacora');
require('./models/AuditoriaDvv');
require('./models/Parking');
require('./models/Repuesto');
require('./models/Proveedor');

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