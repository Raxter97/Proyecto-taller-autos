import { useEffect, useState } from 'react';
import { apiCall } from '../../Api';

export default function Inventario() {
  const [repuestos, setRepuestos] = useState([]);
  const [proveedores, setProveedor] = useState([]);
  
  // Estados de Paginación Repuestos
  const [pageRep, setPageRep] = useState(1);
  const [totalPagesRep, setTotalPagesRep] = useState(1);

  // Formularios
  const [descripcion, setDescripcion] = useState('');
  const [stock, setStock] = useState('');

  const [razonSocial, setRazonSocial] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cargarInventario = async (p = 1) => {
    try {
      const dataRep = await apiCall(`/inventario/repuestos?page=${p}&limit=10`);
      setRepuestos(dataRep.repuestos || []);
      setTotalPagesRep(dataRep.totalPages || 1);
      setPageRep(dataRep.currentPage || 1);

      const dataProv = await apiCall('/inventario/proveedores');
      setProveedor(dataProv.proveedores || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargarInventario(1);
  }, []);

  const handleCrearRepuesto = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await apiCall('/inventario/repuestos', {
        method: 'POST',
        body: JSON.stringify({ descripcion, stock: Number(stock) })
      });
      setSuccess('Repuesto creado con éxito.');
      setDescripcion(''); setStock('');
      cargarInventario(pageRep);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCrearProveedor = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await apiCall('/inventario/proveedores', {
        method: 'POST',
        body: JSON.stringify({ razon_social: razonSocial, direccion, telefono, email })
      });
      setSuccess('Proveedor registrado con éxito.');
      setRazonSocial(''); setDireccion(''); setTelefono(''); setEmail('');
      cargarInventario(pageRep);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Gestión de Inventario y Proveedores</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
        {/* Formulario Repuesto */}
        <form onSubmit={handleCrearRepuesto} style={{ border: '1px solid #444', padding: '15px', flex: '1' }}>
          <h3>Nuevo Repuesto</h3>
          <div><input type="text" placeholder="Descripción" value={descripcion} onChange={e => setDescripcion(e.target.value)} required /></div>
          <div style={{ marginTop: '10px' }}><input type="number" placeholder="Stock Inicial" value={stock} onChange={e => setStock(e.target.value)} required /></div>
          <button type="submit" style={{ marginTop: '10px' }}>Guardar Repuesto</button>
        </form>

        {/* Formulario Proveedor */}
        <form onSubmit={handleCrearProveedor} style={{ border: '1px solid #444', padding: '15px', flex: '1' }}>
          <h3>Nuevo Proveedor</h3>
          <div><input type="text" placeholder="Razón Social" value={razonSocial} onChange={e => setRazonSocial(e.target.value)} required /></div>
          <div style={{ marginTop: '10px' }}><input type="text" placeholder="Dirección" value={direccion} onChange={e => setDireccion(e.target.value)} required /></div>
          <div style={{ marginTop: '10px' }}><input type="text" placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} required /></div>
          <div style={{ marginTop: '10px' }}><input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
          <button type="submit" style={{ marginTop: '10px' }}>Registrar Proveedor</button>
        </form>
      </div>

      {/* Listado de Repuestos con Paginación (RNF-REN-02) */}
      <h3>Listado de Repuestos (Stock)</h3>
      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Descripción</th>
            <th>Stock Actual</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {repuestos.length === 0 ? (
            <tr><td colSpan="4" align="center">No hay repuestos registrados.</td></tr>
          ) : (
            repuestos.map(r => (
              <tr key={r.id_repuesto}>
                <td>{r.id_repuesto}</td>
                <td>{r.descripcion}</td>
                <td>{r.stock}</td>
                <td>{r.estado ? 'Activo' : 'Inactivo'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Controles de Paginación */}
      <div style={{ marginTop: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button 
          disabled={pageRep <= 1} 
          onClick={() => cargarInventario(pageRep - 1)}
        >
          Anterior
        </button>
        <span>Página {pageRep} de {totalPagesRep}</span>
        <button 
          disabled={pageRep >= totalPagesRep} 
          onClick={() => cargarInventario(pageRep + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}