import { useEffect, useState } from 'react';
import { userApi } from '../../api/userApi';

export default function UserAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [idEmpleado, setIdEmpleado] = useState('');
  const [rolesIds, setRolesIds] = useState('1'); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cargarUsuarios = async () => {
    try {
      const data = await userApi.listarUsuarios();
      setUsuarios(data.usuarios || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await userApi.registrarCuenta({
        email,
        password,
        id_empleado: Number(idEmpleado),
        rolesIds: [Number(rolesIds)]
      });
      setSuccess('Cuenta de usuario creada y roles asignados exitosamente.');
      setEmail(''); setPassword(''); setIdEmpleado('');
      cargarUsuarios();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDesactivar = async (id) => {
    if (!window.confirm('¿Deseas desactivar esta cuenta de usuario?')) return;
    try {
      await userApi.desactivarCuenta(id);
      setSuccess('Cuenta desactivada correctamente.');
      cargarUsuarios();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Gestión de Cuentas de Usuario y Roles (Admin)</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <form onSubmit={handleCrearUsuario} style={{ border: '1px solid #444', padding: '15px', marginBottom: '20px' }}>
        <h3>Registrar Cuenta Administrativa / Empleado</h3>
        <div><input type="email" placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} required /></div>
        <div style={{ marginTop: '10px' }}><input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required /></div>
        <div style={{ marginTop: '10px' }}><input type="number" placeholder="ID de Empleado" value={idEmpleado} onChange={e => setIdEmpleado(e.target.value)} required /></div>
        <div style={{ marginTop: '10px' }}>
          <label>ID de Rol (Ej: 1 = Admin): </label>
          <input type="number" value={rolesIds} onChange={e => setRolesIds(e.target.value)} required />
        </div>
        <button type="submit" style={{ marginTop: '10px' }}>Crear Cuenta</button>
      </form>

      <h3>Usuarios del Sistema</h3>
      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Empleado ID</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.length === 0 ? (
            <tr><td colSpan="5" align="center">No hay usuarios registrados.</td></tr>
          ) : (
            usuarios.map(u => (
              <tr key={u.id_user}>
                <td>{u.id_user}</td>
                <td>{u.email}</td>
                <td>{u.id_empleado}</td>
                <td>{u.estado ? 'Activo' : 'Inactivo'}</td>
                <td>
                  {u.estado && (
                    <button onClick={() => handleDesactivar(u.id_user)} style={{ backgroundColor: '#d9534f', color: 'white' }}>
                      Desactivar
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