import { useEffect, useState } from 'react';
import { apiCall } from './Api';

export default function Turnos() {
  const [turnos, setTurnos] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados para el formulario de nuevo turno
  const [fechaHora, setFechaHora] = useState('');
  const [idCliente, setIdCliente] = useState('');
  const [idAuto, setIdAuto] = useState('');

  const cargarTurnos = async () => {
    try {
      const data = await apiCall('/turno');
      setTurnos(data.turnos || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargarTurnos();
  }, []);

  const handleAgendar = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await apiCall('/turno', {
        method: 'POST',
        body: JSON.stringify({
          fecha_hora: fechaHora,
          id_cliente: Number(idCliente),
          id_auto: Number(idAuto),
        }),
      });
      setSuccess('Turno agendado exitosamente.');
      setFechaHora('');
      setIdCliente('');
      setIdAuto('');
      cargarTurnos();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelar = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar este turno?')) return;
    setError('');
    setSuccess('');

    try {
      await apiCall(`/turno/${id}/cancelar`, {
        method: 'PUT',
      });
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

      {/* Formulario para Agendar Turno */}
      <form onSubmit={handleAgendar} style={{ marginBottom: '30px', padding: '15px', border: '1px solid #444', borderRadius: '5px' }}>
        <h3>Agendar Nuevo Turno</h3>
        <div style={{ marginTop: '10px' }}>
          <label>Fecha y Hora:</label><br />
          <input 
            type="datetime-local" 
            value={fechaHora} 
            onChange={(e) => setFechaHora(e.target.value)} 
            required 
          />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>ID del Cliente:</label><br />
          <input 
            type="number" 
            value={idCliente} 
            onChange={(e) => setIdCliente(e.target.value)} 
            placeholder="Ej: 1"
            required 
          />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>ID del Vehículo (Auto):</label><br />
          <input 
            type="number" 
            value={idAuto} 
            onChange={(e) => setIdAuto(e.target.value)} 
            placeholder="Ej: 1"
            required 
          />
        </div>
        <button type="submit" style={{ marginTop: '15px' }}>Agendar Turno</button>
      </form>

      {/* Tabla de Listado de Turnos */}
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
            <tr>
              <td colSpan="6" align="center">No hay turnos registrados.</td>
            </tr>
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
                    <button 
                      onClick={() => handleCancelar(t.id_turno)} 
                      style={{ backgroundColor: '#d9534f', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}
                    >
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