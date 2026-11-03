import { useEffect, useState } from 'react';
import { turnosApi } from '../../api/turnosApi';

export default function Turnos() {
  const [turnos, setTurnos] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filtroMisTurnos, setFiltroMisTurnos] = useState(false);

  // 👈 Estados añadidos para el formulario de agendar turno
  const [nombreCliente, setNombreCliente] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [patenteAuto, setPatenteAuto] = useState('');
  const [fechaHora, setFechaHora] = useState('');

  const cargarTurnos = async () => {
    try {
      const data = filtroMisTurnos 
        ? await turnosApi.obtenerMisTurnos() 
        : await turnosApi.obtenerTodos();
        
      setTurnos(data.turnos || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargarTurnos();
  }, [filtroMisTurnos]);

  const handleAgendar = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // 👈 Enviamos los campos que espera el backend actualizado (nombre, email, patente, fecha_hora)
      await turnosApi.agendar({
        nombre: nombreCliente,
        email: emailCliente,
        patente: patenteAuto.toUpperCase(),
        fecha_hora: fechaHora,
      });
      
      setSuccess('Turno agendado exitosamente.');
      setNombreCliente('');
      setEmailCliente('');
      setPatenteAuto('');
      setFechaHora('');
      cargarTurnos();
    } catch (err) {
      setError(err.response?.data?.mensaje || err.message);
    }
  };

  const handleCancelar = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar este turno?')) return;
    setError('');
    setSuccess('');

    try {
      await turnosApi.cancelar(id);
      setSuccess('Turno cancelado correctamente.');
      cargarTurnos();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="turnos-container" style={{ padding: '20px' }}>
      <h2>Gestión de Turnos y Agenda</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <form onSubmit={handleAgendar} style={{ marginBottom: '30px', padding: '15px', border: '1px solid #444', borderRadius: '5px' }}>
        <h3>Agendar Turno</h3>
        <div style={{ marginBottom: '10px' }}>
          <input type="text" placeholder="Nombre del Cliente" value={nombreCliente} onChange={e => setNombreCliente(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input type="email" placeholder="Email del Cliente" value={emailCliente} onChange={e => setEmailCliente(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input type="text" placeholder="Patente del Vehículo" value={patenteAuto} onChange={e => setPatenteAuto(e.target.value.toUpperCase())} required style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input type="datetime-local" value={fechaHora} onChange={e => setFechaHora(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
        </div>
        <button type="submit" style={{ padding: '8px 15px', backgroundColor: '#4f46e5', color: 'white', border: 'none', cursor: 'pointer' }}>Agendar Turno</button>
      </form>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => setFiltroMisTurnos(false)} 
          style={{ padding: '8px 15px', backgroundColor: !filtroMisTurnos ? '#007bff' : '#ccc', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Ver Todos
        </button>
        <button 
          onClick={() => setFiltroMisTurnos(true)} 
          style={{ padding: '8px 15px', backgroundColor: filtroMisTurnos ? '#007bff' : '#ccc', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Ver Mis Turnos
        </button>
      </div>

      <h3>Turnos Registrados</h3>
      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha y Hora</th>
            <th>Estado</th>
            <th>Cliente</th>
            <th>Vehículo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {turnos.length === 0 ? (
            <tr><td colSpan="6" align="center">No hay turnos registrados.</td></tr>
          ) : (
            turnos.map((t) => (
              <tr key={t.id_turno}>
                <td>{t.id_turno}</td>
                <td>{t.fecha_hora}</td>
                <td>{t.estado}</td>
                <td>{t.Cliente ? `${t.Cliente.nombre} ${t.Cliente.apellido}` : `ID: ${t.id_cliente}`}</td>
                <td>{t.Auto ? `${t.Auto.marca} ${t.Auto.modelo} (${t.Auto.patente})` : `ID: ${t.id_auto}`}</td>
                <td>
                  {t.estado !== 'Cancelado' && t.estado !== 'Atendido' && (
                    <button onClick={() => handleCancelar(t.id_turno)} style={{ backgroundColor: '#d9534f', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>
                      Cancelar
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}