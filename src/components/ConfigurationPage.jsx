import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ConfigurationPage.css';

const ConfigurationPage = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState({
    nodeCount: 15,
    nodeSpeed: 1.5,
    transferRange: 70,
    simulationWidth: 1200,
    simulationHeight: 700
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/simulation', { state: { config } });
  };

  return (
    <div className="configuration-page">
      <div className="config-container">
        <header className="config-header">
          <h1>
            <i className="fas fa-satellite-dish"></i>
            DTN Network Simulator
          </h1>
          <p>Configure your simulation parameters</p>
        </header>

        <form onSubmit={handleSubmit} className="config-form">
          <div className="form-section">
            <h2>
              <i className="fas fa-sliders-h"></i>
              Simulation Parameters
            </h2>
            
            <div className="input-group">
              <label htmlFor="nodeCount">
                <i className="fas fa-users"></i>
                Number of Nodes
              </label>
              <div className="input-with-preview">
                <input
                  type="range"
                  id="nodeCount"
                  name="nodeCount"
                  min="5"
                  max="100"
                  value={config.nodeCount}
                  onChange={handleInputChange}
                />
                <span className="value-preview">{config.nodeCount}</span>
              </div>
              <div className="range-labels">
                <span>5</span>
                <span>100</span>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="nodeSpeed">
                <i className="fas fa-tachometer-alt"></i>
                Node Speed
              </label>
              <div className="input-with-preview">
                <input
                  type="range"
                  id="nodeSpeed"
                  name="nodeSpeed"
                  min="0.5"
                  max="10"
                  step="0.1"
                  value={config.nodeSpeed}
                  onChange={handleInputChange}
                />
                <span className="value-preview">{config.nodeSpeed}x</span>
              </div>
              <div className="range-labels">
                <span>0.5x</span>
                <span>10x</span>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="transferRange">
                <i className="fas fa-broadcast-tower"></i>
                Signal Range
              </label>
              <div className="input-with-preview">
                <input
                  type="range"
                  id="transferRange"
                  name="transferRange"
                  min="30"
                  max="120"
                  value={config.transferRange}
                  onChange={handleInputChange}
                />
                <span className="value-preview">{config.transferRange}px</span>
              </div>
              <div className="range-labels">
                <span>30px</span>
                <span>120px</span>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="simulationWidth">
                <i className="fas fa-arrows-alt-h"></i>
                Simulation Width
              </label>
              <input
                type="number"
                id="simulationWidth"
                name="simulationWidth"
                min="800"
                max="2000"
                value={config.simulationWidth}
                onChange={handleInputChange}
              />
            </div>

            <div className="input-group">
              <label htmlFor="simulationHeight">
                <i className="fas fa-arrows-alt-v"></i>
                Simulation Height
              </label>
              <input
                type="number"
                id="simulationHeight"
                name="simulationHeight"
                min="600"
                max="1200"
                value={config.simulationHeight}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="info-section">
            <h2>
              <i className="fas fa-info-circle"></i>
              How DTN Works
            </h2>
            <div className="info-cards">
              <div className="info-card">
                <div className="icon store">
                  <i className="fas fa-mail-bulk"></i>
                </div>
                <div className="info-content">
                  <h3>Store</h3>
                  <p>Nodes save messages when there's no direct path</p>
                </div>
              </div>
              
              <div className="info-card">
                <div className="icon carry">
                  <i className="fas fa-walking"></i>
                </div>
                <div className="info-content">
                  <h3>Carry</h3>
                  <p>Mobile nodes carry messages while moving</p>
                </div>
              </div>
              
              <div className="info-card">
                <div className="icon forward">
                  <i className="fas fa-share-square"></i>
                </div>
                <div className="info-content">
                  <h3>Forward</h3>
                  <p>Messages are passed when nodes meet</p>
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="start-simulation-btn">
            <i className="fas fa-play"></i>
            Start Simulation
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConfigurationPage;