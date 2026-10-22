const Sequelize = require('sequelize');
// gomez
const sequelize = new Sequelize('proyecto_taller_autos', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  port: 3307 
});

module.exports = sequelize;
