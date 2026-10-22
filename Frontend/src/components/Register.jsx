import { useState } from 'react';
import { apiCall } from '../api';

const dominiosComunes = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com'];

export default function Register({ onSwitchToLogin }) {
  const [emailUsuario, setEmailUsuario] = useState('');
  const [emailDominio, setEmailDominio] = useState('gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const emailCompleto = `${emailUsuario}@${emailDominio}`;

    try {
      await apiCall('/auth/registro', {
        method: 'POST',
        body: JSON.stringify({ 
          email: emailCompleto, 
          password, 
        }),
      });
      setSuccess('Usuario registrado con éxito. Redirigiendo al login...');
      setTimeout(() => {
        onSwitchToLogin();
      }, 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>Registro de Usuario</h2>
      {error && <p className="error-msg" style={{ color: 'red' }}>{error}</p>}
      {success && <p className="success-msg" style={{ color: 'green' }}>{success}</p>}
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
        <button type="submit" style={{ marginTop: '10px' }}>Registrarse</button>
      </form>
      <p style={{ marginTop: '15px' }}>
        ¿Ya tienes una cuenta?{' '}
        <button type="button" onClick={onSwitchToLogin}>Inicia sesión</button>
      </p>
    </div>
  );
}