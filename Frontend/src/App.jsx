import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Perfil from './components/Perfil';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState('login'); // 'login' o 'register'

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (isAuthenticated) {
    return <Perfil onLogout={handleLogout} />;
  }

  return (
    <div className="app-container">
      <h1>Sistema de Gestión de Taller - Acceso</h1>
      {currentView === 'login' ? (
        <Login 
          onLoginSuccess={() => setIsAuthenticated(true)} 
          onSwitchToRegister={() => setCurrentView('register')} 
        />
      ) : (
        <Register 
          onSwitchToLogin={() => setCurrentView('login')} 
        />
      )}
    </div>
  );
}