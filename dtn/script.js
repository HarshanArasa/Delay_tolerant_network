class DTNSimulation {
    constructor() {
        this.canvas = document.getElementById('simulationCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.messages = [];
        this.contacts = [];
        this.isRunning = false;
        this.animationId = null;
        this.lastTimestamp = 0;
        
        // Statistics
        this.stats = {
            totalMessages: 0,
            deliveredMessages: 0,
            totalDelay: 0,
            activeContacts: 0
        };

        this.init();
    }

    init() {
        this.createNodes(6);
        this.setupEventListeners();
        this.updateStats();
        this.draw();
    }

    createNodes(count) {
        this.nodes = [];
        for (let i = 0; i < count; i++) {
            this.nodes.push({
                id: i,
                x: Math.random() * (this.canvas.width - 40) + 20,
                y: Math.random() * (this.canvas.height - 40) + 20,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                radius: 15,
                color: '#3498db',
                messages: [],
                hasMessages: false,
                lastContact: null
            });
        }
    }

    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('addMessageBtn').addEventListener('click', () => this.addRandomMessage());
        document.getElementById('speedSlider').addEventListener('input', (e) => this.updateSpeed(e.target.value));
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            document.getElementById('startBtn').disabled = true;
            document.getElementById('pauseBtn').disabled = false;
            this.lastTimestamp = performance.now();
            this.animate();
        }
    }

    pause() {
        this.isRunning = false;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    reset() {
        this.pause();
        this.messages = [];
        this.contacts = [];
        this.stats = {
            totalMessages: 0,
            deliveredMessages: 0,
            totalDelay: 0,
            activeContacts: 0
        };
        this.createNodes(6);
        this.clearEventLog();
        this.updateStats();
        this.draw();
    }

    updateSpeed(value) {
        // Speed is handled in the animation loop
    }

    addRandomMessage() {
        if (this.nodes.length < 2) return;

        const source = Math.floor(Math.random() * this.nodes.length);
        let target = Math.floor(Math.random() * this.nodes.length);
        while (target === source) {
            target = Math.floor(Math.random() * this.nodes.length);
        }

        const message = {
            id: this.stats.totalMessages,
            source: source,
            target: target,
            createdAt: Date.now(),
            delivered: false,
            deliveryTime: null,
            path: [source]
        };

        this.messages.push(message);
        this.nodes[source].messages.push(message);
        this.nodes[source].hasMessages = true;
        this.nodes[source].color = '#e74c3c';

        this.stats.totalMessages++;
        this.logEvent(`Message ${message.id} created: Node ${source} → Node ${target}`);
        this.updateStats();
    }

    animate(currentTime = 0) {
        if (!this.isRunning) return;

        const deltaTime = currentTime - this.lastTimestamp;
        const speed = document.getElementById('speedSlider').value;
        
        if (deltaTime > 1000 / (10 + speed * 5)) {
            this.update();
            this.lastTimestamp = currentTime;
        }

        this.draw();
        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }

    update() {
        // Update node positions
        this.nodes.forEach(node => {
            node.x += node.vx;
            node.y += node.vy;

            // Bounce off walls
            if (node.x - node.radius < 0 || node.x + node.radius > this.canvas.width) {
                node.vx *= -1;
            }
            if (node.y - node.radius < 0 || node.y + node.radius > this.canvas.height) {
                node.vy *= -1;
            }

            // Add some randomness to movement
            if (Math.random() < 0.02) {
                node.vx += (Math.random() - 0.5) * 0.5;
                node.vy += (Math.random() - 0.5) * 0.5;
                
                // Limit speed
                const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
                if (speed > 3) {
                    node.vx = (node.vx / speed) * 3;
                    node.vy = (node.vy / speed) * 3;
                }
            }
        });

        // Check for contacts and exchange messages
        this.contacts = [];
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const nodeA = this.nodes[i];
                const nodeB = this.nodes[j];
                const distance = Math.sqrt(
                    Math.pow(nodeA.x - nodeB.x, 2) + Math.pow(nodeA.y - nodeB.y, 2)
                );

                if (distance < 100) { // Contact range
                    this.contacts.push({ nodeA, nodeB });
                    this.exchangeMessages(nodeA, nodeB);
                }
            }
        }

        this.stats.activeContacts = this.contacts.length;
        this.updateStats();
    }

    exchangeMessages(nodeA, nodeB) {
        let exchanged = false;

        // NodeA to NodeB
        const messagesFromA = [...nodeA.messages];
        messagesFromA.forEach(message => {
            if (!nodeB.messages.some(m => m.id === message.id)) {
                nodeB.messages.push({...message});
                nodeB.hasMessages = true;
                nodeB.color = '#e74c3c';
                message.path.push(nodeB.id);
                exchanged = true;
                
                // Check if message reached its target
                if (message.target === nodeB.id && !message.delivered) {
                    message.delivered = true;
                    message.deliveryTime = Date.now();
                    this.stats.deliveredMessages++;
                    this.stats.totalDelay += (message.deliveryTime - message.createdAt) / 1000;
                    this.logEvent(`✓ Message ${message.id} delivered to Node ${nodeB.id}! Delay: ${((message.deliveryTime - message.createdAt) / 1000).toFixed(1)}s`);
                }
            }
        });

        // NodeB to NodeA
        const messagesFromB = [...nodeB.messages];
        messagesFromB.forEach(message => {
            if (!nodeA.messages.some(m => m.id === message.id)) {
                nodeA.messages.push({...message});
                nodeA.hasMessages = true;
                nodeA.color = '#e74c3c';
                message.path.push(nodeA.id);
                exchanged = true;
                
                // Check if message reached its target
                if (message.target === nodeA.id && !message.delivered) {
                    message.delivered = true;
                    message.deliveryTime = Date.now();
                    this.stats.deliveredMessages++;
                    this.stats.totalDelay += (message.deliveryTime - message.createdAt) / 1000;
                    this.logEvent(`✓ Message ${message.id} delivered to Node ${nodeA.id}! Delay: ${((message.deliveryTime - message.createdAt) / 1000).toFixed(1)}s`);
                }
            }
        });

        if (exchanged) {
            this.logEvent(`Nodes ${nodeA.id} & ${nodeB.id} exchanged messages`);
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw contact zones
        this.contacts.forEach(contact => {
            this.ctx.strokeStyle = 'rgba(39, 174, 96, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(contact.nodeA.x, contact.nodeA.y);
            this.ctx.lineTo(contact.nodeB.x, contact.nodeB.y);
            this.ctx.stroke();
        });

        // Draw nodes
        this.nodes.forEach(node => {
            // Draw node
            this.ctx.fillStyle = node.color;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw border
            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Draw node ID
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(node.id.toString(), node.x, node.y);

            // Draw message count if node has messages
            if (node.messages.length > 0) {
                this.ctx.fillStyle = '#c0392b';
                this.ctx.beginPath();
                this.ctx.arc(node.x + node.radius - 5, node.y - node.radius + 5, 8, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = 'white';
                this.ctx.font = '10px Arial';
                this.ctx.fillText(node.messages.length.toString(), node.x + node.radius - 5, node.y - node.radius + 5);
            }
        });

        // Draw contact ranges (for visualization)
        if (this.contacts.length > 0) {
            this.contacts.forEach(contact => {
                this.ctx.strokeStyle = 'rgba(39, 174, 96, 0.5)';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(contact.nodeA.x, contact.nodeA.y, 100, 0, Math.PI * 2);
                this.ctx.stroke();
                
                this.ctx.beginPath();
                this.ctx.arc(contact.nodeB.x, contact.nodeB.y, 100, 0, Math.PI * 2);
                this.ctx.stroke();
            });
        }
    }

    updateStats() {
        document.getElementById('totalMessages').textContent = this.stats.totalMessages;
        document.getElementById('deliveredMessages').textContent = this.stats.deliveredMessages;
        
        const deliveryRate = this.stats.totalMessages > 0 ? 
            ((this.stats.deliveredMessages / this.stats.totalMessages) * 100).toFixed(1) : 0;
        document.getElementById('deliveryRate').textContent = `${deliveryRate}%`;
        
        const avgDelay = this.stats.deliveredMessages > 0 ? 
            (this.stats.totalDelay / this.stats.deliveredMessages).toFixed(1) : 0;
        document.getElementById('avgDelay').textContent = `${avgDelay}s`;
        
        document.getElementById('activeContacts').textContent = this.stats.activeContacts;
    }

    logEvent(message) {
        const eventLog = document.getElementById('eventLog');
        const event = document.createElement('div');
        event.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        eventLog.appendChild(event);
        eventLog.scrollTop = eventLog.scrollHeight;
    }

    clearEventLog() {
        document.getElementById('eventLog').innerHTML = '';
    }
}

// Initialize simulation when page loads
document.addEventListener('DOMContentLoaded', () => {
    new DTNSimulation();
});