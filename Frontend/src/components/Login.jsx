import { useState } from 'react';
import { apiCall } from '../Api';

const dominiosComunes = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com'];

export default function Login({ onLoginSuccess, onSwitchToRegister }) {
  const [isRecovering, setIsRecovering] = useState(false);
  const [emailUsuario, setEmailUsuario] = useState('');
  const [emailDominio, setEmailDominio] = useState('gmail.com');
  const [password, setPassword] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const emailCompleto = `${emailUsuario}@${emailDominio}`;

    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: emailCompleto, password }),
      });
      localStorage.setItem('token', data.token);
      onLoginSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRecover = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const emailCompleto = `${emailUsuario}@${emailDominio}`;

    try {
      await apiCall('/auth/recuperar-password', {
        method: 'POST',
        body: JSON.stringify({ email: emailCompleto, nuevaPassword }),
      });
      setSuccessMsg('Contraseña restablecida con éxito. Ya puedes iniciar sesión.');
      setIsRecovering(false);
      setNuevaPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>{isRecovering ? 'Recuperar Contraseña' : 'Iniciar Sesión'}</h2>
      {error && <p className="error-msg" style={{ color: 'red' }}>{error}</p>}
      {successMsg && <p className="success-msg" style={{ color: 'green' }}>{successMsg}</p>}

      {!isRecovering ? (
        <form onSubmit={handleSubmit}>
          <div>
            <label>Correo Electrónico:</label>
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
          <div style={{ marginTop: '10px' }}>
            <label>Contraseña:</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" style={{ marginTop: '10px' }}>Ingresar</button>
        </form>
      ) : (
        <form onSubmit={handleRecover}>
          <div>
            <label>Correo Electrónico:</label>
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
          <div style={{ marginTop: '10px' }}>
            <label>Nueva Contraseña:</label>
            <input 
              type="password" 
              value={nuevaPassword} 
              onChange={(e) => setNuevaPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" style={{ marginTop: '10px' }}>Restablecer Contraseña</button>
        </form>
      )}

      <div style={{ marginTop: '15px' }}>
        <button type="button" onClick={() => { setIsRecovering(!isRecovering); setError(''); setSuccessMsg(''); }}>
          {isRecovering ? 'Volver al Inicio de Sesión' : '¿Olvidaste tu contraseña?'}
        </button>
      </div>

      {!isRecovering && (
        <p style={{ marginTop: '15px' }}>
          ¿No tienes cuenta?{' '}
          <button type="button" onClick={onSwitchToRegister}>Regístrate aquí</button>
        </p>
      )}
    </div>
  );
}