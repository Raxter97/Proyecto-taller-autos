import { useEffect, useState } from 'react';
import { authApi } from '../../api/authApi'; 

const dominiosComunes = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com'];

export default function Perfil({ onLogout, onNavegar }) { 
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [emailUsuario, setEmailUsuario] = useState('');
  const [emailDominio, setEmailDominio] = useState('gmail.com');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passMsg, setPassMsg] = useState('');

  const [permisos, setPermisos] = useState([]);
  const [esEmpleado, setEsEmpleado] = useState(false);

  useEffect(() => {
    authApi.obtenerPerfil()
      .then((data) => {
        const usuarioData = data.user;
        setUser(usuarioData);

        // Lógica de separación de email
        const partes = usuarioData.email.split('@');
        if (partes.length === 2) {
          setEmailUsuario(partes[0]);
          if (!dominiosComunes.includes(partes[1])) {
            dominiosComunes.push(partes[1]);
          }
          setEmailDominio(partes[1]);
        } else {
          setEmailUsuario(usuarioData.email);
        }

        // Extracción de Permisos y Roles 
        const listaPermisos = [];
        let tieneRolEmpleado = false;

        if (usuarioData.Rols && usuarioData.Rols.length > 0) {
          usuarioData.Rols.forEach(rol => {
            if (['Administrativo', 'Recepcionista', 'Mecánico', 'Encargado de deposito'].includes(rol.nombre_rol)) {
              tieneRolEmpleado = true;
            }
            if (rol.Permisos) {
              rol.Permisos.forEach(p => {
                if (!listaPermisos.includes(p.nombre_permiso)) {
                  listaPermisos.push(p.nombre_permiso);
                }
              });
            }
          });
        }
        setPermisos(listaPermisos);
        setEsEmpleado(tieneRolEmpleado);
      })
      .catch((err) => {
        setError(err.message);
        if (err.message.includes('Token') || err.message.includes('No autorizado')) {
          onLogout();
        }
      });
  }, [onLogout]);

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    const nuevoEmail = `${emailUsuario}@${emailDominio}`;

    try {
      const data = await authApi.actualizarEmail({ nuevoEmail });
      setUser((prev) => ({ ...prev, email: data.email }));
      setSuccessMsg('Correo actualizado correctamente.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setPassMsg('');
    try {
      await authApi.actualizarPassword({ passwordActual, passwordNueva });
      setPassMsg('Contraseña actualizada correctamente.');
      setPasswordActual('');
      setPasswordNueva('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar/desactivar tu cuenta?')) {
      try {
        await authApi.eliminarCuenta();
        onLogout();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (error && !user) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!user) return <p>Cargando información del perfil...</p>;

  return (
    <div className="perfil-container">
      <h2>Perfil de Usuario</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}
      
      <div className="perfil-card">
        <p><strong>Estado de Cuenta:</strong> {user.estado ? 'Activo' : 'Inactivo'}</p>
        
        {/* Listado de Permisos de la Cuenta */}
        <div style={{ margin: '15px 0', textAlign: 'left', background: '#222', padding: '10px', borderRadius: '5px' }}>
          <p style={{ margin: '0 0 5px 0' }}><strong>Permisos asignados:</strong></p>
          {permisos.length > 0 ? (
            <ul style={{ margin: '0', paddingLeft: '20px' }}>
              {permisos.map((p, idx) => (
                <li key={idx} style={{ fontSize: '0.9rem', color: '#ccc' }}>{p}</li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: '0', fontSize: '0.9rem', color: '#888' }}>Sin permisos administrativos (Cliente estándar)</p>
          )}
        </div>

        {/* Sección Condicional para Empleados */}
        {esEmpleado && (
          <div style={{ border: '1px solid #646cff', padding: '15px', margin: '15px 0', borderRadius: '5px', background: 'rgba(100, 108, 255, 0.1)' }}>
            <p style={{ margin: '0 0 10px 0' }}><strong>Panel de Operaciones Internas</strong></p>
            <button 
              type="button"
              onClick={() => onNavegar('usuarios')} 
              style={{ backgroundColor: '#646cff', color: 'white', border: 'none', padding: '8px 12px', cursor: 'pointer' }}
            >
              Ir a Gestión de Usuarios / Empleados
            </button>
          </div>
        )}

        <form onSubmit={handleUpdateEmail} style={{ marginTop: '15px' }}>
          <div>
            <label><strong>Actualizar Correo Electrónico:</strong></label>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '5px' }}>
              <input 
                type="text" 
                value={emailUsuario} 
                onChange={(e) => setEmailUsuario(e.target.value)} 
                placeholder="usuario"
                required 
              />
              <span>@</span>
              <select 
                value={emailDominio} 
                onChange={(e) => setEmailDominio(e.target.value)}
              >
                {dominiosComunes.map((dom) => (
                  <option key={dom} value={dom}>
                    {dom}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" style={{ marginTop: '10px' }}>Guardar Cambios</button>
        </form>

        <form onSubmit={handleUpdatePassword} style={{ marginTop: '20px', borderTop: '1px solid #444', paddingTop: '15px' }}>
          <div>
            <label><strong>Actualizar Contraseña:</strong></label>
            {passMsg && <p style={{ color: 'green' }}>{passMsg}</p>}
            <div style={{ marginTop: '5px' }}>
              <input 
                type="password" 
                placeholder="Contraseña actual"
                value={passwordActual} 
                onChange={(e) => setPasswordActual(e.target.value)} 
                required 
              />
            </div>
            <div style={{ marginTop: '5px' }}>
              <input 
                type="password" 
                placeholder="Nueva contraseña"
                value={passwordNueva} 
                onChange={(e) => setPasswordNueva(e.target.value)} 
                required 
              />
            </div>
          </div>
          <button type="submit" style={{ marginTop: '10px' }}>Actualizar Contraseña</button>
        </form>

        <div style={{ marginTop: '20px', borderTop: '1px solid #444', paddingTop: '15px' }}>
          <button 
            type="button" 
            onClick={handleDeleteAccount} 
            style={{ backgroundColor: '#d9534f', color: 'white' }}
          >
            Eliminar Cuenta
          </button>
        </div>
      </div>
      <button onClick={onLogout} style={{ marginTop: '15px' }}>Cerrar Sesión</button>
    </div>
  );
}