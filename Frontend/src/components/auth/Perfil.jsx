import { useEffect, useState } from 'react';
import { authApi } from '../../api/authApi'; 

const dominiosComunes = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com'];

export default function Perfil({ onLogout }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [emailUsuario, setEmailUsuario] = useState('');
  const [emailDominio, setEmailDominio] = useState('gmail.com');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passMsg, setPassMsg] = useState('');

  useEffect(() => {
    authApi.obtenerPerfil()
      .then((data) => {
        setUser(data.user);

        const partes = data.user.email.split('@');
        if (partes.length === 2) {
          setEmailUsuario(partes[0]);
          
          if (!dominiosComunes.includes(partes[1])) {
            dominiosComunes.push(partes[1]);
          }
          setEmailDominio(partes[1]);
        } else {
          setEmailUsuario(data.user.email);
        }
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
      <h2>Panel Principal / Perfil de Usuario</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}
      <div className="perfil-card">
        <p><strong>ID de Usuario:</strong> {user.id_user}</p>
        <p><strong>ID de Empleado Asociado:</strong> {user.id_empleado}</p>
        <p><strong>Estado de Cuenta:</strong> {user.estado ? 'Activo' : 'Inactivo'}</p>
        
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