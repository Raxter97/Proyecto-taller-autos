import { useEffect, useState } from 'react';
import { bitacoraApi } from '../../api/bitacoraApi';

export default function Bitacora() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    bitacoraApi.consultar()
      .then(data => setLogs(data.logs || data || []))
      .catch(err => setError(err.message));
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Bitácora de Auditoría del Sistema</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '15px' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha / Hora</th>
            <th>Usuario ID</th>
            <th>Acción</th>
            <th>Nivel Impacto</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr><td colSpan="6" align="center">No hay registros en la bitácora.</td></tr>
          ) : (
            logs.map(log => (
              <tr key={log.id_bitacora}>
                <td>{log.id_bitacora}</td>
                <td>{log.fecha_hora}</td>
                <td>{log.id_usuario}</td>
                <td>{log.accion}</td>
                <td>{log.nivel_impacto}</td>
                <td><small>{log.descripcion}</small></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}