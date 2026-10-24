const express = require('express');
const cors = require('cors');
require('dotenv').config();


const AuthRoutes = require('./routes/AuthRoutes');
const ClienteRoutes = require('./routes/ClienteRoutes');
const EmpleadoRoutes = require('./routes/EmpleadoRoutes');
const AutoRoutes = require('./routes/AutoRoutes');
const ParkingRoutes = require('./routes/ParkingRoutes');
const TurnoRoutes = require('./routes/TurnoRoutes');
const InventarioRoutes = require('./routes/InventarioRoutes');
const servicioRoutes = require('./routes/ServicioRoutes');
const informeRoutes = require('./routes/InformeRoutes');
const facturaRoutes = require('./routes/facturaRoutes');

const app = express();
app.use(cors())
app.use(express.json())


app.use('/api/autos', AutoRoutes);
app.use('/api/clientes', ClienteRoutes);
app.use('/api/empleados', EmpleadoRoutes);
app.use('/api/parking', ParkingRoutes);
app.use('/api/turnos', TurnoRoutes);
app.use('/api/inventario', InventarioRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/taller/informes', informeRoutes);
app.use('/api/facturacion', facturaRoutes);

app.use('/api/auth', AuthRoutes);

module.exports = app;