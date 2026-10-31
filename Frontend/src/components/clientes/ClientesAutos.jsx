import { useEffect, useState } from 'react';
import { clientesApi } from '../../api/clientesApi';
import { autosApi } from '../../api/autosApi';

export default function ClientesAutos() {
  const [clientes, setClientes] = useState([]);
  const [historial, setHistorial] = useState(null);
  const [patenteBusqueda, setPatenteBusqueda] = useState('');
  
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');

  const [autoPatente, setAutoPatente] = useState('');
  const [autoMarca, setAutoMarca] = useState('');
  const [autoModelo, setAutoModelo] = useState('');
  const [autoIdCliente, setAutoIdCliente] = useState('');

  const [misAutos, setMisAutos] = useState([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cargarDatos = async () => {
    try {
      const resClientes = await clientesApi.obtenerTodos().catch(() => ({ clientes: [] }));
      setClientes(resClientes.clientes || []);

      try {
        const response = await autosApi.obtenerMisAutos();
        setMisAutos(response.data?.autos || response.autos || []);
      } catch (err) {
        // Ignorar si el rol actual no es cliente o no requiere mis autos
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCrearCliente = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await clientesApi.crear({ dni, nombre, apellido, email, telefono, direccion });
      setSuccess('Cliente registrado exitosamente.');
      setDni(''); setNombre(''); setApellido(''); setEmail(''); setTelefono(''); setDireccion('');
      cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCrearAuto = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await autosApi.crear({ 
        patente: autoPatente, 
        marca: autoMarca, 
        modelo: autoModelo, 
        id_cliente: Number(autoIdCliente) 
      });
      setSuccess('Vehículo registrado exitosamente.');
      setAutoPatente(''); setAutoMarca(''); setAutoModelo(''); setAutoIdCliente('');
      cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBuscarHistorial = async (e) => {
    e.preventDefault();
    setError('');
    setHistorial(null);
    try {
      const data = await autosApi.consultarHistorial(patenteBusqueda);
      setHistorial(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Gestión de Clientes y Vehículos</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <form onSubmit={handleCrearCliente} style={{ border: '1px solid #444', padding: '15px', flex: '1' }}>
          <h3>Registrar Cliente</h3>
          <div><input type="text" placeholder="DNI" value={dni} onChange={e => setDni(e.target.value)} required /></div>
          <div><input type="text" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} required /></div>
          <div><input type="text" placeholder="Apellido" value={apellido} onChange={e => setApellido(e.target.value)} required /></div>
          <div><input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
          <div><input type="text" placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} required /></div>
          <div><input type="text" placeholder="Dirección" value={direccion} onChange={e => setDireccion(e.target.value)} /></div>
          <button type="submit" style={{ marginTop: '10px' }}>Guardar Cliente</button>
        </form>

        <form onSubmit={handleCrearAuto} style={{ border: '1px solid #444', padding: '15px', flex: '1' }}>
          <h3>Registrar Vehículo</h3>
          <div><input type="text" placeholder="Patente (Ej: AB123CD)" value={autoPatente} onChange={e => setAutoPatente(e.target.value)} required /></div>
          <div><input type="text" placeholder="Marca" value={autoMarca} onChange={e => setAutoMarca(e.target.value)} required /></div>
          <div><input type="text" placeholder="Modelo" value={autoModelo} onChange={e => setAutoModelo(e.target.value)} required /></div>
          <div><input type="number" placeholder="ID del Cliente Propietario" value={autoIdCliente} onChange={e => setAutoIdCliente(e.target.value)} required /></div>
          <button type="submit" style={{ marginTop: '10px' }}>Vincular Vehículo</button>
        </form>
      </div>

      <div style={{ marginTop: '30px', border: '1px solid #444', padding: '15px' }}>
        <h3>Mis Vehículos Registrados</h3>
        <ul>
          {misAutos.length === 0 ? (
            <p>No hay vehículos registrados para este usuario.</p>
          ) : (
            misAutos.map((auto) => (
              <li key={auto.id_auto}>
                {auto.marca} {auto.modelo} - Patente: {auto.patente}
              </li>
            ))
          )}
        </ul>
      </div>

      <div style={{ marginTop: '30px', border: '1px solid #444', padding: '15px' }}>
        <h3>Consultar Historial Técnico por Patente</h3>
        <form onSubmit={handleBuscarHistorial} style={{ display: 'flex', gap: '10px' }}>
          <input type="text" placeholder="Ingrese Patente" value={patenteBusqueda} onChange={e => setPatenteBusqueda(e.target.value.toUpperCase())} required />
          <button type="submit">Buscar Historial</button>
        </form>

        {historial && (
          <div style={{ marginTop: '15px', background: '#222', padding: '10px' }}>
            <h4>Vehículo: {historial.auto.marca} {historial.auto.modelo} ({historial.auto.patente})</h4>
            <h5>Informes de Reparación:</h5>
            {historial.historial.length === 0 ? (
              <p>No registra informes técnicos previos.</p>
            ) : (
              historial.historial.map(inf => (
                <div key={inf.id_informe} style={{ borderBottom: '1px solid #555', margin: '10px 0', paddingBottom: '5px' }}>
                  <p><strong>Fecha:</strong> {inf.fecha} | <strong>Estado:</strong> {inf.estado ? 'Finalizado' : 'En Proceso'}</p>
                  <p><strong>Descripción:</strong> {inf.descripcion}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}