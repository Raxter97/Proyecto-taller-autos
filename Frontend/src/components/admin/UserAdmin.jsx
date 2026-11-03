import { useEffect, useState } from 'react';
import { userApi } from '../../api/userApi';

export default function UserAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [emailCuenta, setEmailCuenta] = useState('');
  const [rolIdSeleccionado, setRolIdSeleccionado] = useState('1');  
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

  const handleModificarRoles = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await userApi.actualizarRolesCuenta({
        email: emailCuenta,
        rolesIds: [Number(rolIdSeleccionado)]
      });
      setSuccess('Roles de la cuenta actualizados exitosamente.');
      setEmailCuenta(''); 
      setRolIdSeleccionado('1');
      cargarUsuarios();
    } catch (err) {
      setError(err.response?.data?.mensaje || err.message);
    }
  };

  const handleCambiarEstado = async (id, activar) => {
    const accionTexto = activar ? 'activar' : 'desactivar';
    if (!window.confirm(`¿Deseas ${accionTexto} esta cuenta de usuario?`)) return;
    setError('');
    setSuccess('');
    try {
      if (activar) {
        await userApi.activarCuenta(id);
        setSuccess('Cuenta activada correctamente.');
      } else {
        await userApi.desactivarCuenta(id);
        setSuccess('Cuenta desactivada correctamente.');
      }
      cargarUsuarios();
    } catch (err) {
      setError(err.response?.data?.mensaje || err.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Gestión de Cuentas de Usuario y Roles (Admin)</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      {/*selector de roles */}
      <form onSubmit={handleModificarRoles} style={{ border: '1px solid #444', padding: '15px', marginBottom: '20px', borderRadius: '5px', background: '#1e1e1e' }}>
        <h3>Agregar y Modificar Roles a una Cuenta</h3>
        
        <div style={{ marginTop: '10px' }}>
          <label>Email de la Cuenta:</label><br />
          <input 
            type="email" 
            placeholder="usuario@correo.com" 
            value={emailCuenta} 
            onChange={e => setEmailCuenta(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginTop: '10px' }}>
          <label>Seleccionar Rol:</label><br />
          <select 
            value={rolIdSeleccionado} 
            onChange={e => setRolIdSeleccionado(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px', background: '#2a2a2a', color: 'white', borderRadius: '4px' }}
          >
            <option value="1">1 - Administrativo</option>
            <option value="2">2 - Recepcionista</option>
            <option value="3">3 - Mecánico</option>
            <option value="4">4 - Encargado de deposito</option>
            <option value="5">5 - Usuario</option>
          </select>
        </div>

        <button type="submit" style={{ marginTop: '15px', backgroundColor: '#4f46e5', color: 'white', padding: '8px 15px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
          Guardar Cambios de Roles
        </button>
      </form>

      <h3>Usuarios del Sistema</h3>
      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Roles Asignados</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.length === 0 ? (
            <tr><td colSpan="4" align="center">No hay usuarios registrados.</td></tr>
          ) : (
            usuarios.map(u => {
              const rolesList = (u.Rols || u.roles || []).map(r => r.nombre_rol).join(', ') || 'Sin roles';
              return (
                <tr key={u.id_user}>
                  <td>{u.email}</td>
                  <td>{rolesList}</td>
                  <td>{u.estado ? 'Activo' : 'Inactivo'}</td>
                  <td>
                    {u.estado ? (
                      <button onClick={() => handleCambiarEstado(u.id_user, false)} style={{ backgroundColor: '#d9534f', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '3px' }}>
                        Desactivar
                      </button>
                    ) : (
                      <button onClick={() => handleCambiarEstado(u.id_user, true)} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '3px' }}>
                        Activar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}