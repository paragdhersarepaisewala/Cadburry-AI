import React, { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import StealthMode from './components/StealthMode';

function App() {
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return route === '#/stealth' ? <StealthMode /> : <Dashboard />;
}

export default App;
