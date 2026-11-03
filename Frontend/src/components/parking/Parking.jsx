import { useEffect, useState } from 'react';
import { parkingApi } from '../../api/parkingApi';

export default function Parking() {
  const [plazas, setPlazas] = useState([]);
  const [nroLugarIngreso, setNroLugarIngreso] = useState('');
  const [patenteIngreso, setPatenteIngreso] = useState('');
  const [nroLugarSalida, setNroLugarSalida] = useState(''); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cargarParking = async () => {
    try {
      const data = await parkingApi.consultar();
      setPlazas(data.plazas || data.parking || []);
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
        patente: patenteIngreso.toUpperCase().trim()
      });
      setSuccess('Ingreso de vehículo registrado en la plaza.');
      setNroLugarIngreso(''); setPatenteIngreso('');
      cargarParking();
    } catch (err) {
      setError(err.response?.data?.mensaje || err.message);
    }
  };

  const handleLiberarPorInput = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    const nro = Number(nroLugarSalida);
    const plazaElegida = plazas.find(p => p.nro_lugar === nro);

    // Si la plaza no está registrada en BD o su estado es falso (libre)
    if (!plazaElegida || !plazaElegida.estado) {
      setError(`La plaza ${nro} ya se encuentra libre.`);
      return;
    }

    if (!window.confirm(`¿Liberar plaza de parking número ${nro}?`)) return;

    try {
      await parkingApi.salida(nro);
      setSuccess(`Plaza ${nro} liberada correctamente.`);
      setNroLugarSalida('');
      cargarParking();
    } catch (err) {
      setError(err.response?.data?.mensaje || err.message);
    }
  };

  const handleSalidaBotonCuadrado = async (nro_lugar) => {
    setError(''); setSuccess('');
    const plazaElegida = plazas.find(p => p.nro_lugar === nro_lugar);
    
    if (!plazaElegida || !plazaElegida.estado) {
      setError(`La plaza ${nro_lugar} ya se encuentra libre.`);
      return;
    }

    if (!window.confirm(`¿Liberar plaza de parking número ${nro_lugar}?`)) return;
    
    try {
      await parkingApi.salida(nro_lugar);
      setSuccess(`Plaza ${nro_lugar} liberada correctamente.`);
      cargarParking();
    } catch (err) {
      setError(err.response?.data?.mensaje || err.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Recepción y Control de Parking</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <form onSubmit={handleIngreso} style={{ border: '1px solid #444', padding: '15px', marginBottom: '20px', borderRadius: '5px' }}>
        <h3>Registrar Ingreso a Plaza de Parking</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="number" placeholder="Nro de Plaza (1 al 8)" min="1" max="8" value={nroLugarIngreso} onChange={e => setNroLugarIngreso(e.target.value)} required />
          <input type="text" placeholder="Patente del Auto" value={patenteIngreso} onChange={e => setPatenteIngreso(e.target.value.toUpperCase())} required />
          <button type="submit">Asignar Plaza</button>
        </div>
      </form>

      <h3>Estado de las Plazas de Parking (8 Plazas)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginTop: '15px' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((nro) => {
          const plazaActual = plazas.find(p => p.nro_lugar === nro) || { nro_lugar: nro, estado: false };
          const estaOcupado = plazaActual.estado;

          return (
            <div 
              key={nro} 
              style={{ 
                border: '2px solid #555', 
                padding: '20px', 
                borderRadius: '8px',
                textAlign: 'center',
                backgroundColor: estaOcupado ? '#d97706' : '#2c4a2c',
                color: 'white',
                minHeight: '100px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <h4 style={{ margin: '0' }}>Plaza #{nro}</h4>
              <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
                {estaOcupado ? 'Ocupado' : 'Libre'}
              </p>
              {estaOcupado && (
                <button 
                  type="button"
                  onClick={() => handleSalidaBotonCuadrado(nro)} 
                  style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '5px', cursor: 'pointer', borderRadius: '4px' }}
                >
                  Liberar Plaza
                </button>
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleLiberarPorInput} style={{ border: '1px solid #444', padding: '15px', marginTop: '30px', borderRadius: '5px' }}>
        <h3>Liberar Plaza</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="number" 
            placeholder="Nro de Plaza a liberar (1 al 8)" 
            min="1" 
            max="8" 
            value={nroLugarSalida} 
            onChange={e => setNroLugarSalida(e.target.value)} 
            required 
          />
          <button type="submit" style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '8px 15px', cursor: 'pointer', borderRadius: '4px' }}>
            Liberar Plaza
          </button>
        </div>
      </form>
    </div>
  );
}