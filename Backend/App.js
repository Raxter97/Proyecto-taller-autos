const express = require('express');
const cors = require('cors');
require('dotenv').config();


const AuthRoutes = require('./routes/AuthRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const empleadoRoutes = require('./routes/empleadoRoutes');
const autoRoutes = require('./routes/autoRoutes');
const parkingRoutes = require('./routes/parkingRoutes');
const turnoRoutes = require('./routes/TurnoRoutes');


const app = express();
app.use(cors())
app.use(express.json())


app.use('/api/autos', autoRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/empleados', empleadoRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/turnos', turnoRoutes);

app.use('/api/auth', AuthRoutes);

module.exports = app;