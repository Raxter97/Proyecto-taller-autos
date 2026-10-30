import { useState } from 'react';
import { facturasApi } from '../../api/facturaApi';

export default function Factura() {
  const [idInforme, setIdInforme] = useState('');
  const [idFacturaPagar, setIdFacturaPagar] = useState('');
  const [medioPago, setMedioPago] = useState('Efectivo');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGenerarFactura = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const data = await facturasApi.generar({ id_informe: Number(idInforme) });
      setSuccess(`Factura generada con éxito. Monto total: $${data.factura?.monto_total || 'N/D'}`);
      setIdInforme('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRegistrarPago = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await facturasApi.registrarPago(idFacturaPagar, { medio_pago: medioPago });
      setSuccess('Pago registrado con éxito. Factura pagada y vehículo habilitado para salir del parking.');
      setIdFacturaPagar('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Facturación y Cobranzas</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <form onSubmit={handleGenerarFactura} style={{ border: '1px solid #444', padding: '15px', flex: '1' }}>
          <h3>Generar Factura de Servicio</h3>
          <div>
            <label>ID de Informe Técnico Finalizado:</label><br />
            <input type="number" value={idInforme} onChange={e => setIdInforme(e.target.value)} placeholder="Ej: 1" required />
          </div>
          <button type="submit" style={{ marginTop: '10px' }}>Generar Factura</button>
        </form>

        <form onSubmit={handleRegistrarPago} style={{ border: '1px solid #444', padding: '15px', flex: '1' }}>
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
          <button type="submit" style={{ marginTop: '10px' }}>Registrar Pago</button>
        </form>
      </div>
    </div>
  );
}