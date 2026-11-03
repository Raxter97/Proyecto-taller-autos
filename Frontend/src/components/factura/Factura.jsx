import { useState, useEffect } from 'react';
import { facturasApi } from '../../api/facturaApi';

export default function Factura() {
  const [idInforme, setIdInforme] = useState('');
  const [idFacturaPagar, setIdFacturaPagar] = useState('');
  const [medioPago, setMedioPago] = useState('Efectivo');
  const [cuotas, setCuotas] = useState('3');
  const [nroCupon, setNroCupon] = useState('');


  const [idAutoFiltro, setIdAutoFiltro] = useState('');
  const [idClienteFiltro, setIdClienteFiltro] = useState('');
  const [listaFacturas, setListaFacturas] = useState([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');


  useEffect(() => {
    cargarTodasLasFacturas();
  }, []);

  const cargarTodasLasFacturas = async () => {
    try {
      const data = await facturasApi.obtenerTodas();
      setListaFacturas(data.facturas || []);
    } catch (err) {
      setError(err.response?.data?.mensaje || err.message);
    }
  };

  const handleGenerarFactura = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const data = await facturasApi.generar({ id_informe: Number(idInforme) });
      setSuccess('Factura generada con éxito.');
      setIdInforme('');
      cargarTodasLasFacturas();
    } catch (err) {
      setError(err.response?.data?.mensaje || err.message);
    }
  };

  const handleRegistrarPago = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const payload = { medio_pago: medioPago };
      if (medio_pago === 'Tarjeta') {
        payload.cuotas = Number(cuotas);
        payload.nro_cupon = nroCupon;
      }

      await facturasApi.registrarPago(idFacturaPagar, payload);
      setSuccess('Pago registrado con éxito. Factura pagada y vehículo habilitado para salir del parking.');
      setIdFacturaPagar('');
      setNroCupon('');
      cargarTodasLasFacturas();
    } catch (err) {
      setError(err.response?.data?.mensaje || err.message);
    }
  };

  const handleBuscarPorAuto = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const data = await facturasApi.obtenerPorAuto(idAutoFiltro);
      setListaFacturas(data.facturas || []);
    } catch (err) {
      setError(err.response?.data?.mensaje || err.message);
    }
  };

  const handleBuscarPorCliente = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const data = await facturasApi.obtenerPorCliente(idClienteFiltro);
      setListaFacturas(data.facturas || []);
    } catch (err) {
      setError(err.response?.data?.mensaje || err.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Facturas y Cobros </h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* Generar Factura */}
        <form onSubmit={handleGenerarFactura} style={{ border: '1px solid #444', padding: '15px', flex: '1', minWidth: '300px' }}>
          <h3>Generar Factura de Servicio</h3>
          <div>
            <label>ID de Informe Técnico Finalizado:</label><br />
            <input type="number" value={idInforme} onChange={e => setIdInforme(e.target.value)} placeholder="Ej: 1" required />
          </div>
          <button type="submit" style={{ marginTop: '10px' }}>Generar Factura</button>
        </form>

        {/* Registrar Pago */}
        <form onSubmit={handleRegistrarPago} style={{ border: '1px solid #444', padding: '15px', flex: '1', minWidth: '300px' }}>
          <h3>Registrar Pago de Factura</h3>
          <div>
            <label>ID de Factura:</label><br />
            <input type="number" value={idFacturaPagar} onChange={e => setIdFacturaPagar(e.target.value)} placeholder="Ej: 1" required />
          </div>
          <div style={{ marginTop: '10px' }}>
            <label>Medio de Pago:</label><br />
            <select value={medioPago} onChange={e => setMedioPago(e.target.value)}>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Tarjeta">Tarjeta (Crédito/Débito)</option>
            </select>
          </div>

          {medioPago === 'Tarjeta' && (
            <div style={{ marginTop: '10px' }}>
              <label>Cuotas:</label><br />
              <select value={cuotas} onChange={e => setCuotas(e.target.value)}>
                <option value="3">3 Cuotas (10% recargo)</option>
                <option value="6">6 Cuotas (20% recargo)</option>
                <option value="12">12 Cuotas (35% recargo)</option>
              </select>
              <div style={{ marginTop: '10px' }}>
                <label>Nro. de Cupón / Comprobante:</label><br />
                <input type="text" value={nroCupon} onChange={e => setNroCupon(e.target.value)} placeholder="Ej: CUPON-12345" required />
              </div>
            </div>
          )}

          <button type="submit" style={{ marginTop: '10px' }}>Registrar Pago</button>
        </form>
      </div>

      {/* Sección de Consultas y Filtros */}
      <div style={{ marginTop: '30px', borderTop: '1px solid #444', paddingTop: '20px' }}>
        <h3>Consultas de Facturas</h3>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <form onSubmit={handleBuscarPorAuto}>
            <input type="number" placeholder="ID de Auto" value={idAutoFiltro} onChange={e => setIdAutoFiltro(e.target.value)} required />
            <button type="submit" style={{ marginLeft: '5px' }}>Filtrar por Auto</button>
          </form>

          <form onSubmit={handleBuscarPorCliente}>
            <input type="number" placeholder="ID de Cliente" value={idClienteFiltro} onChange={e => setIdClienteFiltro(e.target.value)} required />
            <button type="submit" style={{ marginLeft: '5px' }}>Filtrar por Cliente</button>
          </form>

          <button type="button" onClick={cargarTodasLasFacturas} style={{ backgroundColor: '#555', color: 'white' }}>
            Ver Todas
          </button>
        </div>

        {/* Listado de Facturas */}
        <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', borderColor: '#444' }}>
          <thead>
            <tr style={{ background: '#222' }}>
              <th>ID Factura</th>
              <th>Informe</th>
              <th>Fecha Emisión</th>
              <th>Monto Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {listaFacturas.length > 0 ? (
              listaFacturas.map(fac => (
                <tr key={fac.id_factura}>
                  <td>{fac.id_factura}</td>
                  <td>{fac.id_informe}</td>
                  <td>{new Date(fac.fecha_emision).toLocaleDateString()}</td>
                  <td>${fac.monto_total}</td>
                  <td style={{ color: fac.estado === 'pagada' ? 'lightgreen' : 'orange' }}>
                    {fac.estado.toUpperCase()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>No hay facturas registradas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}