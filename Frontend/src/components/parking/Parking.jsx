import { useEffect, useState } from 'react';
import { parkingApi } from '../../api/parkingApi';

export default function Parking() {
  const [plazas, setPlazas] = useState([]);
  const [nroLugarIngreso, setNroLugarIngreso] = useState('');
  const [idAutoIngreso, setIdAutoIngreso] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cargarParking = async () => {
    try {
      const data = await parkingApi.consultar();
      setPlazas(data.parking || data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargarParking();
  }, []);

  const handleIngreso = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await parkingApi.ingreso({
        nro_lugar: Number(nroLugarIngreso),
        id_auto: Number(idAutoIngreso)
      });
      setSuccess('Ingreso de vehículo registrado en la plaza de parking.');
      setNroLugarIngreso(''); setIdAutoIngreso('');
      cargarParking();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSalida = async (nro_lugar) => {
    if (!window.confirm(`¿Liberar plaza de parking número ${nro_lugar}? (Se validará que la factura esté pagada)`)) return;
    setError(''); setSuccess('');
    try {
      await parkingApi.salida(nro_lugar);
      setSuccess('Salida registrada con éxito. Plaza liberada.');
      cargarParking();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Recepción y Control de Parking</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <form onSubmit={handleIngreso} style={{ border: '1px solid #444', padding: '15px', marginBottom: '20px' }}>
        <h3>Registrar Ingreso a Plaza de Parking</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="number" placeholder="Nro de Lugar (Plaza)" value={nroLugarIngreso} onChange={e => setNroLugarIngreso(e.target.value)} required />
          <input type="number" placeholder="ID del Auto" value={idAutoIngreso} onChange={e => setIdAutoIngreso(e.target.value)} required />
          <button type="submit">Asignar Plaza</button>
        </div>
      </form>

      <h3>Estado de las Plazas de Parking</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
        {plazas.map(p => (
          <div key={p.id_parking || p.nro_lugar} style={{ border: '1px solid #555', padding: '15px', background: p.estado ? '#4a2c2c' : '#2c4a2c' }}>
            <h4>Plaza Nro: {p.nro_lugar}</h4>
            <p><strong>Estado:</strong> {p.estado ? 'Ocupado' : 'Libre'}</p>
            {p.id_auto && <p><strong>Auto ID:</strong> {p.id_auto}</p>}
            {p.estado && (
              <button onClick={() => handleSalida(p.nro_lugar)} style={{ backgroundColor: '#d9534f', color: 'white', marginTop: '10px' }}>
                Registrar Salida
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}