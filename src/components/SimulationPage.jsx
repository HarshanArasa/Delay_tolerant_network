import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './SimulationPage.css';

const SimulationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  const config = location.state?.config || {
    nodeCount: 15,
    nodeSpeed: 1.5,
    transferRange: 70,
    simulationWidth: 1200,
    simulationHeight: 700
  };

  const [simulationState, setSimulationState] = useState({
    running: false,
    paused: false,
    messageDelivered: false,
    hopCount: 0,
    totalCarriers: 1,
    startTime: 0,
    elapsedTime: 0
  });

  const [nodes, setNodes] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [messagePath, setMessagePath] = useState([]);

  // Colors
  const colors = {
    SENDER: '#ea580c',
    RECEIVER: '#16a34a',
    CARRIER: '#facc15',
    NODE: '#9ca3af',
    RANGE: 'rgba(249, 115, 22, 0.3)'
  };

  // Initialize nodes - useCallback to memoize the function
  const initializeNodes = useCallback(() => {
    const newNodes = [];
    const nodeRadius = config.nodeCount > 50 ? 7 : 10;

    for (let i = 0; i < config.nodeCount; i++) {
      const node = {
        id: i,
        x: Math.random() * (config.simulationWidth - 40) + 20,
        y: Math.random() * (config.simulationHeight - 40) + 20,
        dx: 0,
        dy: 0,
        radius: nodeRadius,
        hasMessage: i === 0,
        isSender: i === 0,
        isReceiver: i === config.nodeCount - 1,
        contactedNodes: new Set() // Track which nodes this node has contacted
      };
      setRandomDirection(node);
      newNodes.push(node);
    }
    setNodes(newNodes);
  }, [config.nodeCount, config.simulationWidth, config.simulationHeight]);

  const setRandomDirection = (node) => {
    const angle = Math.random() * 2 * Math.PI;
    node.dx = Math.cos(angle) * config.nodeSpeed;
    node.dy = Math.sin(angle) * config.nodeSpeed;
  };

  // Update simulation - useCallback to memoize the function
  const updateSimulation = useCallback(() => {
    if (simulationState.messageDelivered) return;

    setNodes(prevNodes => {
      const updatedNodes = prevNodes.map(node => {
        // Change direction randomly
        if (Math.random() < 0.02) {
          setRandomDirection(node);
        }

        const newNode = { ...node };
        newNode.x += newNode.dx;
        newNode.y += newNode.dy;

        // Boundary collision with bounce
        if (newNode.x - newNode.radius < 0) {
          newNode.dx = Math.abs(newNode.dx);
          newNode.x = newNode.radius;
        } else if (newNode.x + newNode.radius > config.simulationWidth) {
          newNode.dx = -Math.abs(newNode.dx);
          newNode.x = config.simulationWidth - newNode.radius;
        }

        if (newNode.y - newNode.radius < 0) {
          newNode.dy = Math.abs(newNode.dy);
          newNode.y = newNode.radius;
        } else if (newNode.y + newNode.radius > config.simulationHeight) {
          newNode.dy = -Math.abs(newNode.dy);
          newNode.y = config.simulationHeight - newNode.radius;
        }

        return newNode;
      });

      return updatedNodes;
    });

    // Check for message transfers after state update
    setTimeout(() => {
      setNodes(currentNodes => {
        const nodesArray = [...currentNodes];
        let newHopCount = simulationState.hopCount;
        let newTotalCarriers = simulationState.totalCarriers;
        let messageDelivered = simulationState.messageDelivered;
        const newActivityLog = [...activityLog];
        const newMessagePath = [...messagePath];

        // Find all carriers (nodes with message)
        const carriers = nodesArray.filter(node => node.hasMessage && !node.isReceiver);
        
        for (const carrier of carriers) {
          if (messageDelivered) break;

          for (const targetNode of nodesArray) {
            // Skip if target already has message or is the same node
            if (targetNode.hasMessage || targetNode.id === carrier.id) continue;

            // Skip if carrier already contacted this node (prevent spam)
            if (carrier.contactedNodes && carrier.contactedNodes.has(targetNode.id)) continue;

            const distance = Math.sqrt(
              Math.pow(carrier.x - targetNode.x, 2) + Math.pow(carrier.y - targetNode.y, 2)
            );

            if (distance <= config.transferRange) {
              // Mark that carrier has contacted this node
              if (!carrier.contactedNodes) carrier.contactedNodes = new Set();
              carrier.contactedNodes.add(targetNode.id);

              // Transfer message
              targetNode.hasMessage = true;
              newHopCount++;
              newTotalCarriers++;
              
              // Log activity
              const activity = `Node ${carrier.id} → Node ${targetNode.id} (Distance: ${Math.round(distance)}px)`;
              newActivityLog.push(activity);
              if (newActivityLog.length > 8) newActivityLog.shift();

              // Update message path
              newMessagePath.push({ from: carrier.id, to: targetNode.id });

              if (targetNode.isReceiver) {
                messageDelivered = true;
                const deliveryTime = Math.floor((Date.now() - simulationState.startTime) / 1000);
                newActivityLog.push(`🎉 MESSAGE DELIVERED to Receiver (Node ${targetNode.id}) in ${deliveryTime}s with ${newHopCount} hops!`);
                if (newActivityLog.length > 8) newActivityLog.shift();
              }
              break; // Only transfer to one node per frame
            }
          }
        }

        // Update states
        if (newHopCount !== simulationState.hopCount || newTotalCarriers !== simulationState.totalCarriers || messageDelivered !== simulationState.messageDelivered) {
          setSimulationState(prev => ({
            ...prev,
            hopCount: newHopCount,
            totalCarriers: newTotalCarriers,
            messageDelivered
          }));
        }

        if (newActivityLog.length !== activityLog.length) {
          setActivityLog(newActivityLog);
        }

        if (newMessagePath.length !== messagePath.length) {
          setMessagePath(newMessagePath);
        }

        drawCanvas(nodesArray);
        return nodesArray;
      });
    }, 0);
  }, [
    simulationState.messageDelivered, 
    simulationState.hopCount, 
    simulationState.totalCarriers, 
    simulationState.startTime,
    activityLog, 
    messagePath, 
    config.transferRange, 
    config.simulationWidth, 
    config.simulationHeight
  ]);

  const drawCanvas = (nodesToDraw = nodes) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connection lines first (so they appear behind nodes)
    nodesToDraw.forEach(carrier => {
      if (carrier.hasMessage && !carrier.isReceiver) {
        nodesToDraw.forEach(target => {
          if (!target.hasMessage && target.id !== carrier.id) {
            const distance = Math.sqrt(
              Math.pow(carrier.x - target.x, 2) + Math.pow(carrier.y - target.y, 2)
            );
            
            if (distance <= config.transferRange) {
              // Draw potential connection line
              ctx.beginPath();
              ctx.moveTo(carrier.x, carrier.y);
              ctx.lineTo(target.x, target.y);
              ctx.strokeStyle = 'rgba(249, 115, 22, 0.2)';
              ctx.lineWidth = 1;
              ctx.setLineDash([2, 2]);
              ctx.stroke();
              ctx.setLineDash([]);
            }
          }
        });
      }
    });

    // Draw nodes
    nodesToDraw.forEach(node => {
      // Determine color
      let color;
      if (node.isReceiver && node.hasMessage) {
        color = colors.RECEIVER;
      } else if (node.isReceiver) {
        color = colors.RECEIVER;
      } else if (node.isSender) {
        color = colors.SENDER;
      } else if (node.hasMessage) {
        color = colors.CARRIER;
      } else {
        color = colors.NODE;
      }

      // Draw node with glow for special nodes
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      if (node.isSender || node.isReceiver) {
        ctx.shadowColor = node.isSender ? colors.SENDER : colors.RECEIVER;
        ctx.shadowBlur = 20;
      } else if (node.hasMessage) {
        ctx.shadowColor = colors.CARRIER;
        ctx.shadowBlur = 15;
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
      ctx.fill();

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Draw range for carriers
      if (node.hasMessage && !node.isReceiver) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, config.transferRange, 0, 2 * Math.PI);
        ctx.strokeStyle = colors.RANGE;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw node ID
      ctx.fillStyle = 'white';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.id.toString(), node.x, node.y);
    });
  };

  // Initialize nodes on component mount
  useEffect(() => {
    initializeNodes();
  }, [initializeNodes]);

  // Game loop
  useEffect(() => {
    if (simulationState.running && !simulationState.paused) {
      const gameLoop = () => {
        updateSimulation();
        animationFrameRef.current = requestAnimationFrame(gameLoop);
      };
      gameLoop();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [simulationState.running, simulationState.paused, updateSimulation]);

  // Update elapsed time
  useEffect(() => {
    let interval;
    if (simulationState.running && !simulationState.paused && !simulationState.messageDelivered) {
      interval = setInterval(() => {
        setSimulationState(prev => ({
          ...prev,
          elapsedTime: Math.floor((Date.now() - prev.startTime) / 1000)
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [simulationState.running, simulationState.paused, simulationState.messageDelivered]);

  const startSimulation = () => {
    if (simulationState.running) return;
    
    setSimulationState({
      running: true,
      paused: false,
      messageDelivered: false,
      hopCount: 0,
      totalCarriers: 1,
      startTime: Date.now(),
      elapsedTime: 0
    });
    
    setActivityLog(['🚀 Simulation started!', `Sender (Node 0) broadcasting to ${config.transferRange}px range...`]);
    setMessagePath([{ from: 0, to: null, type: 'start' }]);
    
    // Reset nodes with fresh initialization
    initializeNodes();
  };

  const togglePause = () => {
    if (!simulationState.running) return;
    
    setSimulationState(prev => ({
      ...prev,
      paused: !prev.paused
    }));
    
    const activity = simulationState.paused ? '▶️ Simulation resumed' : '⏸️ Simulation paused';
    setActivityLog(prev => [...prev.slice(-7), activity]);
  };

  const resetSimulation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setSimulationState({
      running: false,
      paused: false,
      messageDelivered: false,
      hopCount: 0,
      totalCarriers: 1,
      startTime: 0,
      elapsedTime: 0
    });
    
    setActivityLog([]);
    setMessagePath([]);
    initializeNodes();
  };

  const goBack = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    navigate('/');
  };

  return (
    <div className={`simulation-page ${simulationState.running ? 'simulation-running' : ''} ${simulationState.messageDelivered ? 'message-delivered' : ''}`}>
      <div className="simulation-header">
        <button onClick={goBack} className="back-button">
          <i className="fas fa-arrow-left"></i>
          Back to Configuration
        </button>
        <h1>DTN Network Simulation</h1>
        <div className="simulation-controls">
          <button 
            onClick={startSimulation} 
            disabled={simulationState.running && !simulationState.paused}
            className="control-btn start"
          >
            <i className="fas fa-play"></i>
            Start
          </button>
          <button 
            onClick={togglePause} 
            disabled={!simulationState.running}
            className="control-btn pause"
          >
            <i className={`fas ${simulationState.paused ? 'fa-play' : 'fa-pause'}`}></i>
            {simulationState.paused ? 'Resume' : 'Pause'}
          </button>
          <button onClick={resetSimulation} className="control-btn reset">
            <i className="fas fa-redo"></i>
            Reset
          </button>
        </div>
      </div>

      <div className="simulation-content">
        <div className="simulation-main">
          <div className="canvas-container">
            <canvas
              ref={canvasRef}
              width={config.simulationWidth}
              height={config.simulationHeight}
              className="simulation-canvas"
            />
            
            {!simulationState.running && (
              <div className="start-prompt">
                <div className="prompt-content">
                  <i className="fas fa-satellite-dish"></i>
                  <h3>DTN Simulation Ready</h3>
                  <p>Configured: {config.nodeCount} nodes, {config.nodeSpeed}x speed, {config.transferRange}px range</p>
                  <p>Click Start to begin message propagation</p>
                </div>
              </div>
            )}

            {simulationState.messageDelivered && (
              <div className="start-prompt">
                <div className="prompt-content">
                  <i className="fas fa-flag-checkered" style={{color: '#16a34a'}}></i>
                  <h3>Message Delivered!</h3>
                  <p>Time: {simulationState.elapsedTime}s</p>
                  <p>Hops: {simulationState.hopCount}</p>
                  <p>Carriers: {simulationState.totalCarriers}/{config.nodeCount}</p>
                </div>
              </div>
            )}
          </div>

          <div className="stats-panel">
            <div className="stat-card">
              <div className="stat-icon nodes">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-info">
                <div className="stat-value">{simulationState.totalCarriers}</div>
                <div className="stat-label">Nodes with Message</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon hops">
                <i className="fas fa-code-branch"></i>
              </div>
              <div className="stat-info">
                <div className="stat-value">{simulationState.hopCount}</div>
                <div className="stat-label">Network Hops</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon time">
                <i className="fas fa-clock"></i>
              </div>
              <div className="stat-info">
                <div className="stat-value">{simulationState.elapsedTime}s</div>
                <div className="stat-label">Time Elapsed</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon speed">
                <i className="fas fa-tachometer-alt"></i>
              </div>
              <div className="stat-info">
                <div className="stat-value">{config.nodeSpeed}x</div>
                <div className="stat-label">Node Speed</div>
              </div>
            </div>
          </div>
        </div>

        <div className="info-panels">
          <div className="activity-panel">
            <h3>
              <i className="fas fa-broadcast-tower"></i>
              Network Activity
            </h3>
            <div className="activity-log">
              {activityLog.length === 0 ? (
                <div className="no-activity">No activity yet. Click Start to begin.</div>
              ) : (
                activityLog.map((activity, index) => (
                  <div key={index} className="activity-item">
                    {activity}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="path-panel">
            <h3>
              <i className="fas fa-route"></i>
              Message Path
            </h3>
            <div className="path-log">
              {messagePath.length === 0 ? (
                <div className="no-path">Message journey will appear here...</div>
              ) : (
                messagePath.map((step, index) => (
                  <div key={index} className="path-step">
                    {step.type === 'start' ? (
                      <>
                        <i className="fas fa-play-circle text-green-600"></i>
                        <span>Start: <strong>Sender (Node {step.from})</strong></span>
                      </>
                    ) : step.to === config.nodeCount - 1 ? (
                      <>
                        <i className="fas fa-flag-checkered text-blue-600"></i>
                        <span><strong>DELIVERY:</strong> Node {step.from} → Receiver (Node {step.to})</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-share text-yellow-600"></i>
                        <span>Hop {index}: Node {step.from} → Node {step.to}</span>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationPage;