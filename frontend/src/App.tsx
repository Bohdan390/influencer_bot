import React from 'react';
import Index from './pages/Index';
import { WebSocketProvider } from './contexts/WebSocketContext';
import './App.css';

function App() {
  return (
    <WebSocketProvider autoConnect={true}>
      <div className="App">
        <Index />
      </div>
    </WebSocketProvider>
  );
}

export default App;
