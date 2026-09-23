import React from 'react';
import { useAppStore } from './store';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ReviewScreen from './components/ReviewScreen';

const App: React.FC = () => {
  const { isAuthenticated, currentView } = useAppStore();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <>
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'review' && <ReviewScreen />}
    </>
  );
};

export default App;