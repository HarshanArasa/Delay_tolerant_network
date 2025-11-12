import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ConfigurationPage from './components/ConfigurationPage';
import SimulationPage from './components/SimulationPage';
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<ConfigurationPage />} />
          <Route path="/simulation" element={<SimulationPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;