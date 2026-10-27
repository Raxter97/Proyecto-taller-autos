import { useState, useEffect } from 'react';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Perfil from './components/auth/Perfil';
import Turnos from './components/turnos/Turnos';
import ClientesAutos from './components/clientes/ClientesAutos';
import TallerInformes from './components/taller/TallerInformes';
import Inventario from './components/inventario/Inventario';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState('login'); 

 
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      setCurrentView('perfil'); 
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentView('turnos');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setCurrentView('login');
  };

  // Vistas públicas (Autenticación)
  if (!isAuthenticated) {
    if (currentView === 'register') {
      return (
        <Register 
          onSwitchToLogin={() => setCurrentView('login')} 
        />
      );
    }
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        onSwitchToRegister={() => setCurrentView('register')} 
      />
    );
  }

  // Vista privada con Menú de Navegación principal
  return (
    <div className="app-main-container">
      {/* Barra de Navegación de Módulos */}
      <nav style={{ 
        display: 'flex', 
        gap: '15px', 
        padding: '15px 20px', 
        backgroundColor: '#1a1a1a', 
        borderBottom: '1px solid #333',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <strong style={{ color: '#646cff', marginRight: '15px' }}>Taller Automotriz</strong>
        
        <button 
          onClick={() => setCurrentView('turnos')}
          style={{ backgroundColor: currentView === 'turnos' ? '#646cff' : 'transparent' }}
        >
          Agenda / Turnos
        </button>

        <button 
          onClick={() => setCurrentView('clientes')}
          style={{ backgroundColor: currentView === 'clientes' ? '#646cff' : 'transparent' }}
        >
          Clientes y Vehículos
        </button>

        <button 
          onClick={() => setCurrentView('taller')}
          style={{ backgroundColor: currentView === 'taller' ? '#646cff' : 'transparent' }}
        >
          Taller e Informes
        </button>

        <button 
          onClick={() => setCurrentView('perfil')}
          style={{ backgroundColor: currentView === 'perfil' ? '#646cff' : 'transparent', marginLeft: 'auto' }}
        >
          Mi Perfil
        </button>

        <button 
          onClick={handleLogout} 
          style={{ backgroundColor: '#d9534f', color: 'white' }}
        >
          Cerrar Sesión
        </button>
      </nav>

      {/* Área de Contenido Dinámico */}
      <main style={{ padding: '20px' }}>
        {currentView === 'turnos' && <Turnos />}
        {currentView === 'clientes' && <ClientesAutos />}
        {currentView === 'taller' && <TallerInformes />}
        {currentView === 'perfil' && <Perfil onLogout={handleLogout} />}
      </main>
    </div>
  );
}