import { useEffect, useState } from 'react';
import { informesApi } from '../../api/informesApi';

export default function TallerInformes() {
  const [informes, setInformes] = useState([]);
  const [idAuto, setIdAuto] = useState('');
  const [idEmpleado, setIdEmpleado] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cargarInformes = async () => {
    try {
      const data = await informesApi.obtenerTodos().catch(() => ({ informes: [] }));
      setInformes(data.informes || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargarInformes();
  }, []);

  const handleCrearInforme = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await informesApi.crear({
        id_auto: Number(idAuto),
        id_empleado: Number(idEmpleado),
        descripcion,
      });
      setSuccess('Informe técnico abierto con éxito y turno asociado marcado como "Atendido".');
      setIdAuto('');
      setIdEmpleado('');
      setDescripcion('');
      cargarInformes();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Módulo de Taller e Informes Técnicos</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <form onSubmit={handleCrearInforme} style={{ border: '1px solid #444', padding: '15px', marginBottom: '30px', borderRadius: '5px' }}>
        <h3>Abrir Nuevo Informe en Taller</h3>
        <div style={{ marginTop: '10px' }}>
          <label>ID del Vehículo (Auto):</label><br />
          <input type="number" value={idAuto} onChange={(e) => setIdAuto(e.target.value)} placeholder="Ej: 1" required />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>ID del Empleado (Mecánico asignado):</label><br />
          <input type="number" value={idEmpleado} onChange={(e) => setIdEmpleado(e.target.value)} placeholder="Ej: 2" required />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>Descripción del Diagnóstico / Reparación:</label><br />
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Detalle de trabajos a realizar..." rows="3" style={{ width: '100%' }} required />
        </div>
        <button type="submit" style={{ marginTop: '15px' }}>Registrar Apertura de Informe</button>
      </form>

      <h3>Informes en el Taller</h3>
      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha</th>
            <th>Vehículo (ID)</th>
            <th>Mecánico (ID)</th>
            <th>Descripción</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {informes.length === 0 ? (
            <tr><td colSpan="6" align="center">No hay informes registrados.</td></tr>
          ) : (
            informes.map((inf) => (
              <tr key={inf.id_informe || inf.id}>
                <td>{inf.id_informe || inf.id}</td>
                <td>{inf.fecha}</td>
                <td>{inf.id_auto}</td>
                <td>{inf.id_empleado}</td>
                <td>{inf.descripcion}</td>
                <td>{inf.estado ? 'Finalizado' : 'En Proceso'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}