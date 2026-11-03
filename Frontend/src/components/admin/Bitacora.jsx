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
      <h2>Bitácora del Sistema</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <table border="1" cellPadding="6" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '15px' }}>
        <thead>
          <tr>
            <th>Fecha / Hora</th>
            <th>Acción</th>
            <th>Nivel Impacto</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr><td colSpan="4" align="center">No hay registros en la bitácora.</td></tr>
          ) : (
            logs.map(log => (
              <tr key={log.id_bitacora}>
                {/* 1. Fecha formateada a hora local */}
                <td>{log.fecha_hora ? new Date(log.fecha_hora).toLocaleString() : ''}</td>
                <td>{log.accion}</td>
                <td>{log.nivel_impacto}</td>
                {/* 2. Celdas con restricciones de ancho y salto de línea para el JSON */}
                <td style={{ maxWidth: '350px', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                  <small>{log.descripcion}</small>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}