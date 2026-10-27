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
const UserRoutes = require('./routes/UserRoutes');
const BitacoraRoutes = require('./routes/BitacoraRoutes');


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
app.use('/api/usuarios', UserRoutes);
app.use('/api/bitacora', BitacoraRoutes);

app.use('/api/auth', AuthRoutes);

app.use((err, req, res, next) => {
    console.error('Error no controlado:', err.stack);
    res.status(500).json({
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

module.exports = app;