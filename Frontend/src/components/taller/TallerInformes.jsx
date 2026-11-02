import { useEffect, useState } from 'react';
import { informesApi } from '../../api/informesApi';

export default function TallerInformes() {
  const [informes, setInformes] = useState([]);
  const [patente, setPatente] = useState('');
  const [legajo, setLegajo] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const [idInformeSeleccionado, setIdInformeSeleccionado] = useState('');
  const [descripcionRepuesto, setDescripcionRepuesto] = useState('');
  const [cantidadRepuesto, setCantidadRepuesto] = useState('');
  const [descripcionServicio, setDescripcionServicio] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cargarInformes = async () => {
    try {
      const data = await informesApi.obtenerTodos();
      setInformes(data.informes || []);
    } catch (err) {
      setError(err.response?.data?.mensaje || err.message);
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
        patente: patente.toUpperCase(),
        legajo: Number(legajo),
        descripcion,
      });
      setSuccess('Informe técnico abierto con éxito y turno asociado marcado como "Atendido".');
      setPatente('');
      setLegajo('');
      setDescripcion('');
      cargarInformes();
    } catch (err) {
      setError(err.response?.data?.mensaje || err.message);
    }
  };

  const handleImputarRepuesto = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await informesApi.imputarRepuesto(idInformeSeleccionado, {
        descripcionRepuesto,
        cantidad: Number(cantidadRepuesto),
      });
      setSuccess('Repuesto imputado correctamente al informe.');
      setDescripcionRepuesto('');
      setCantidadRepuesto('');
      cargarInformes();
    } catch (err) {
      setError(err.response?.data?.mensaje || err.message);
    }
  };

  const handleImputarServicio = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await informesApi.imputarServicio(idInformeSeleccionado, {
        descripcionServicio,
      });
      setSuccess('Servicio imputado correctamente al informe.');
      setDescripcionServicio('');
      cargarInformes();
    } catch (err) {
      setError(err.response?.data?.mensaje || err.message);
    }
  };

  const handleFinalizarInforme = async (id_informe) => {
    if (!window.confirm('¿Estás seguro de que deseas finalizar este informe técnico?')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await informesApi.finalizar(id_informe);
      setSuccess('Informe técnico finalizado correctamente.');
      cargarInformes();
    } catch (err) {
      setError(err.response?.data?.mensaje || err.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Gestión de Informes Técnicos</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
        <form onSubmit={handleCrearInforme} style={{ border: '1px solid #444', padding: '15px', flex: '1', minWidth: '300px', borderRadius: '5px' }}>
          <h3>Abrir Nuevo Informe</h3>
          <div style={{ marginTop: '10px' }}>
            <label>Patente del Vehículo:</label><br />
            <input type="text" value={patente} onChange={(e) => setPatente(e.target.value.toUpperCase())} placeholder="Ej: AB123CD" required />
          </div>
          <div style={{ marginTop: '10px' }}>
            <label>Legajo del Empleado:</label><br />
            <input type="number" value={legajo} onChange={(e) => setLegajo(e.target.value)} placeholder="Ej: 1001" required />
          </div>
          <div style={{ marginTop: '10px' }}>
            <label>Descripción del Diagnóstico:</label><br />
            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Detalle de trabajos..." rows="2" style={{ width: '100%' }} required />
          </div>
          <button type="submit" style={{ marginTop: '15px' }}>Abrir Informe</button>
        </form>

        <div style={{ border: '1px solid #444', padding: '15px', flex: '1', minWidth: '300px', borderRadius: '5px' }}>
          <h3>Imputar a Informe Activo</h3>
          <div style={{ marginTop: '10px' }}>
            <label>ID de Informe Destino:</label><br />
            <input type="number" value={idInformeSeleccionado} onChange={(e) => setIdInformeSeleccionado(e.target.value)} placeholder="Ej: 1" required />
          </div>

          <form onSubmit={handleImputarRepuesto} style={{ marginTop: '15px', borderTop: '1px dashed #555', paddingTop: '10px' }}>
            <h4>Imputar Repuesto</h4>
            <input type="text" placeholder="Descripción Repuesto" value={descripcionRepuesto} onChange={(e) => setDescripcionRepuesto(e.target.value)} required style={{ width: '45%', marginRight: '5%' }} />
            <input type="number" placeholder="Cantidad" value={cantidadRepuesto} onChange={(e) => setCantidadRepuesto(e.target.value)} required style={{ width: '45%' }} />
            <button type="submit" style={{ marginTop: '10px' }}>Agregar Repuesto</button>
          </form>

          <form onSubmit={handleImputarServicio} style={{ marginTop: '15px', borderTop: '1px dashed #555', paddingTop: '10px' }}>
            <h4>Imputar Servicio</h4>
            <input type="text" placeholder="Descripción Servicio" value={descripcionServicio} onChange={(e) => setDescripcionServicio(e.target.value)} required style={{ width: '60%', marginRight: '5%' }} />
            <button type="submit" style={{ marginTop: '10px' }}>Agregar Servicio</button>
          </form>
        </div>
      </div>

      <h3>Informes en el Taller</h3>
      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', borderColor: '#444' }}>
        <thead>
          <tr style={{ background: '#222' }}>
            <th>ID</th>
            <th>Fecha</th>
            <th>Auto (Patente)</th>
            <th>Mecánico (Legajo)</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {informes.length === 0 ? (
            <tr><td colSpan="7" align="center">No hay informes registrados.</td></tr>
          ) : (
            informes.map((inf) => (
              <tr key={inf.id_informe || inf.id}>
                <td>{inf.id_informe || inf.id}</td>
                <td>{inf.fecha}</td>
                <td>{inf.auto?.patente || inf.id_auto}</td>
                <td>{inf.empleado?.legajo || inf.id_empleado}</td>
                <td>{inf.descripcion}</td>
                <td style={{ color: inf.estado ? 'lightgreen' : 'orange' }}>
                  {inf.estado ? 'Finalizado' : 'En Proceso'}
                </td>
                <td>
                  {!inf.estado && (
                    <button 
                      onClick={() => handleFinalizarInforme(inf.id_informe || inf.id)}
                      style={{ backgroundColor: '#d9534f', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}
                    >
                      Finalizar
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