// Sternjäger Abenteuer für Anton & Valentin
// Ein galaktisches Weltraum-Abenteuer!
// Mit Sternenkraft-Training!

const Game = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    
    // Game state
    pilotName: '',
    score: 0,
    crystals: 0,
    isRunning: false,
    controlMode: 'touch', // 'touch' or 'camera'
    gameMode: 'jaeger', // 'jaeger', 'force', or 'saber'
    
    // Energieklinge Training Mode
    saber: {
        drohne: {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            size: 50,
            speed: 2,
            moveTimer: 0,
            hit: false,
            hitTimer: 0,
            laserActive: false,
            laserTimer: 0,
            laserAngle: 0
        },
        klinge: {
            x: 0,
            y: 0,
            prevX: 0,
            prevY: 0,
            angle: 0,
            length: 150,
            swinging: false,
            trail: []
        },
        hits: 0,
        misses: 0,
        level: 1,
        targetHits: 5,
        blindMode: false
    },
    
    // Saber Training Missions
    saberMissions: [
        { level: 1, target: 5, message: '⚔️ Triff die Trainingsdrohne 5 mal!', blind: false },
        { level: 2, target: 8, message: '⚔️ Schneller! 8 Treffer!', blind: false },
        { level: 3, target: 10, message: '🙈 Vertraue der Sternenkraft! (Blind-Modus)', blind: true }
    ],
    
    // Sternjäger (Star Fighter)
    jaeger: {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        width: 80,
        height: 60,
        speed: 0.1
    },
    
    // Game objects
    stars: [],
    collectibles: [],
    explosions: [],
    
    // Camera tracking
    camera: null,
    hands: null,
    handX: 0.5,
    handY: 0.5,
    handOpen: true,
    cameraInitialized: false,
    
    // Mission
    currentMission: 0,
    missions: [
        { type: 'crystals', target: 5, message: '💎 Sammle 5 Kristalle!' },
        { type: 'crystals', target: 10, message: '💎 Sammle 10 Kristalle!' },
        { type: 'boss', target: 0, message: '💀 SCHATTENMOND! Zerstöre ihn!' }
    ],
    missionProgress: 0,
    
    // Schattenmond Boss (Shadow Moon)
    schattenmond: {
        active: false,
        x: 0,
        y: 0,
        size: 150,
        health: 20,
        maxHealth: 20,
        hits: 0,
        shaking: false,
        explosions: [],
        defeated: false
    },
    
    // Sternenkraft Training Mode
    force: {
        objects: [],
        targetZone: { x: 0, y: 0, radius: 100 },  // Bigger target zone
        heldObject: null,
        forceBeam: null,
        level: 1,
        objectsPlaced: 0,
        targetCount: 3,
        forceEnergy: 100,
        maxForceEnergy: 100
    },
    
    // Sternenkraft Training Missions
    forceMissions: [
        { level: 1, target: 3, message: '🪨 Hebe 3 Steine mit der Sternenkraft!', objectType: 'rock' },
        { level: 2, target: 5, message: '🪨 Hebe 5 Steine! Werde stärker!', objectType: 'rock' },
        { level: 3, target: 1, message: '🚀 Hebe den STERNJÄGER aus dem Sumpf!', objectType: 'jaeger' }
    ],
    
    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Setup event listeners
        this.setupStartScreen();
    },
    
    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Update Sternjäger size based on screen
        const scale = Math.min(this.width, this.height) / 600;
        this.jaeger.width = Math.max(60, 80 * scale);
        this.jaeger.height = Math.max(45, 60 * scale);
        
        // Update force target zone
        this.force.targetZone.x = this.width * 0.8;
        this.force.targetZone.y = this.height * 0.3;
    },
    
    setupStartScreen() {
        // Skip pilot selection - set default name
        this.pilotName = 'Sternenkapitän';
        
        // Hide pilot select, show game mode directly
        document.querySelector('.pilot-select').classList.add('hidden');
        document.getElementById('game-mode-select').classList.remove('hidden');
        
        // Game mode selection
        document.getElementById('jaeger-mode-btn').addEventListener('click', () => {
            this.gameMode = 'jaeger';
            document.getElementById('game-mode-select').classList.add('hidden');
            document.getElementById('mode-select').classList.remove('hidden');
        });
        
        document.getElementById('force-mode-btn').addEventListener('click', () => {
            this.gameMode = 'force';
            document.getElementById('game-mode-select').classList.add('hidden');
            document.getElementById('mode-select').classList.remove('hidden');
            // Update button text for Force mode
            document.getElementById('camera-mode-btn').innerHTML = '✋ HÄNDE (Sternenkraft!)';
            document.getElementById('touch-mode-btn').innerHTML = '👆 TIPPEN';
        });
        
        document.getElementById('saber-mode-btn').addEventListener('click', () => {
            this.gameMode = 'saber';
            document.getElementById('game-mode-select').classList.add('hidden');
            document.getElementById('mode-select').classList.remove('hidden');
            // Update button text for Saber mode
            document.getElementById('camera-mode-btn').innerHTML = '✋ HÄNDE (Energieklinge!)';
            document.getElementById('touch-mode-btn').innerHTML = '👆 WISCHEN';
        });
        
        // Control mode selection
        document.getElementById('camera-mode-btn').addEventListener('click', () => {
            this.controlMode = 'camera';
            this.startGame();
        });
        
        document.getElementById('touch-mode-btn').addEventListener('click', () => {
            this.controlMode = 'touch';
            this.startGame();
        });
        
        // Play again
        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.resetGame();
        });
        
        // Back to menu
        document.getElementById('back-btn').addEventListener('click', () => {
            this.goToMenu();
        });
    },
    
    goToMenu() {
        // Stop the game
        this.isRunning = false;
        
        // Reset all game state
        this.score = 0;
        this.crystals = 0;
        this.currentMission = 0;
        this.collectibles = [];
        this.explosions = [];
        this.force.objects = [];
        this.force.heldObject = null;
        this.saber.hits = 0;
        this.saber.blindMode = false;
        this.schattenmond.active = false;
        this.schattenmond.defeated = false;
        
        // Re-acquire canvas reference (may have been cloned)
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        // Hide game screen, show start screen
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('celebration').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
        document.getElementById('mode-select').classList.add('hidden');
        document.getElementById('game-mode-select').classList.remove('hidden');
        
        // Reset button texts
        document.getElementById('camera-mode-btn').innerHTML = '📷 KAMERA';
        document.getElementById('touch-mode-btn').innerHTML = '👆 TIPPEN';
    },
    
    async startGame() {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        
        // Ensure canvas reference is valid
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        // Create initial stars
        this.createStars();
        
        if (this.gameMode === 'force') {
            // Initialize Force Training mode
            await this.initForceMode();
        } else if (this.gameMode === 'saber') {
            // Initialize Energieklinge Training mode
            await this.initSaberMode();
        } else {
            // Initialize Sternjäger mode
            await this.initJaegerMode();
        }
        
        // Start game loop
        this.isRunning = true;
        this.gameLoop();
        
        if (this.gameMode === 'jaeger') {
            this.spawnLoop();
        }
    },
    
    async initJaegerMode() {
        // Initialize Sternjäger position
        this.jaeger.x = this.width / 2;
        this.jaeger.y = this.height * 0.7;
        this.jaeger.targetX = this.jaeger.x;
        this.jaeger.targetY = this.jaeger.y;
        
        // Setup controls
        if (this.controlMode === 'camera') {
            await this.setupCamera();
        } else {
            this.setupTouchControls();
        }
        
        // Show first mission
        this.showMission();
    },
    
    async initForceMode() {
        // Reset force state
        this.force.level = 1;
        this.force.objectsPlaced = 0;
        this.force.heldObject = null;
        this.force.forceEnergy = 100;
        
        // Update UI for Force mode
        document.getElementById('score').textContent = '✨ 0';
        document.getElementById('crystals').textContent = `🪨 0/${this.forceMissions[0].target}`;
        
        // Setup controls
        if (this.controlMode === 'camera') {
            await this.setupCamera(true); // Force mode needs hand gesture detection
        } else {
            this.setupForceTouchControls();
        }
        
        // Create force objects
        this.spawnForceObjects();
        
        // Show mission
        this.showForceMission();
    },
    
    async initSaberMode() {
        // Reset saber state
        this.saber.hits = 0;
        this.saber.misses = 0;
        this.saber.level = 1;
        this.saber.targetHits = this.saberMissions[0].target;
        this.saber.blindMode = false;
        
        // Initialize drohne position
        this.saber.drohne.x = this.width / 2;
        this.saber.drohne.y = this.height / 3;
        this.saber.drohne.targetX = this.saber.drohne.x;
        this.saber.drohne.targetY = this.saber.drohne.y;
        this.saber.drohne.hit = false;
        
        // Initialize Energieklinge
        this.saber.klinge.x = this.width / 2;
        this.saber.klinge.y = this.height * 0.7;
        this.saber.klinge.trail = [];
        
        // Update UI
        document.getElementById('score').textContent = '⚔️ 0';
        document.getElementById('crystals').textContent = `🎯 0/${this.saberMissions[0].target}`;
        
        // Setup controls
        if (this.controlMode === 'camera') {
            await this.setupCamera(false);
            this.setupSaberCameraControls();
        } else {
            this.setupSaberTouchControls();
        }
        
        // Start drohne movement
        this.moveRemote();
        
        // Show mission
        this.showSaberMission();
    },
    
    showSaberMission() {
        const mission = this.saberMissions[this.saber.level - 1];
        const msgEl = document.getElementById('mission-message');
        msgEl.textContent = mission.message;
        msgEl.classList.remove('hidden');
        
        setTimeout(() => {
            msgEl.classList.add('hidden');
            // Enable blind mode if needed
            if (mission.blind) {
                this.saber.blindMode = true;
            }
        }, 3000);
    },
    
    moveRemote() {
        if (!this.isRunning || this.gameMode !== 'saber') return;
        
        const drohne = this.saber.drohne;
        
        // Pick new random target position
        const margin = 100;
        drohne.targetX = margin + Math.random() * (this.width - margin * 2);
        drohne.targetY = margin + Math.random() * (this.height * 0.5);
        
        // Speed increases with level
        drohne.speed = 1.5 + this.saber.level * 0.5;
        
        // Occasionally fire laser at player (warning shot)
        if (Math.random() < 0.3 && !drohne.hit) {
            setTimeout(() => this.fireRemoteLaser(), 500);
        }
        
        // Schedule next move
        const interval = 2000 - (this.saber.level * 300);
        setTimeout(() => this.moveRemote(), Math.max(800, interval));
    },
    
    fireRemoteLaser() {
        if (this.gameMode !== 'saber' || !this.isRunning) return;
        
        const drohne = this.saber.drohne;
        drohne.laserActive = true;
        drohne.laserTimer = 15; // frames
        drohne.laserAngle = Math.atan2(
            this.saber.klinge.y - drohne.y,
            this.saber.klinge.x - drohne.x
        );
    },
    
    setupSaberTouchControls() {
        const canvas = this.canvas;
        const saber = this.saber.klinge;
        let lastTouchTime = 0;
        
        const handleMove = (x, y) => {
            saber.prevX = saber.x;
            saber.prevY = saber.y;
            saber.x = x;
            saber.y = y;
            
            // Calculate angle based on movement
            const dx = saber.x - saber.prevX;
            const dy = saber.y - saber.prevY;
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                saber.angle = Math.atan2(dy, dx) + Math.PI / 2;
                saber.swinging = true;
                
                // Add to trail
                saber.trail.push({ x: saber.x, y: saber.y, alpha: 1 });
                if (saber.trail.length > 20) saber.trail.shift();
                
                // Check collision with drohne
                this.checkSaberHit();
            }
        };
        
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            saber.x = touch.clientX;
            saber.y = touch.clientY;
            saber.prevX = saber.x;
            saber.prevY = saber.y;
            saber.swinging = true;
            lastTouchTime = Date.now();
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            handleMove(touch.clientX, touch.clientY);
        });
        
        canvas.addEventListener('touchend', (e) => {
            saber.swinging = false;
        });
        
        // Mouse controls for desktop
        canvas.addEventListener('mousedown', (e) => {
            saber.x = e.clientX;
            saber.y = e.clientY;
            saber.prevX = saber.x;
            saber.prevY = saber.y;
            saber.swinging = true;
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (saber.swinging || e.buttons === 1) {
                handleMove(e.clientX, e.clientY);
            }
        });
        
        canvas.addEventListener('mouseup', (e) => {
            saber.swinging = false;
        });
    },
    
    setupSaberCameraControls() {
        // Camera mode: use hand position for Energieklinge
        // The existing camera setup tracks hand position
        // We'll use handX, handY in update
    },
    
    checkSaberHit() {
        const drohne = this.saber.drohne;
        const saber = this.saber.klinge;
        
        if (drohne.hit) return; // Already hit, waiting for reset
        
        // Calculate saber tip position
        const tipX = saber.x + Math.cos(saber.angle - Math.PI / 2) * saber.length;
        const tipY = saber.y + Math.sin(saber.angle - Math.PI / 2) * saber.length;
        
        // Check collision with drohne
        const dist = Math.hypot(tipX - drohne.x, tipY - drohne.y);
        const dist2 = Math.hypot(saber.x - drohne.x, saber.y - drohne.y);
        
        if (dist < drohne.size + 20 || dist2 < drohne.size + 20) {
            // HIT!
            this.registerSaberHit();
        }
    },
    
    registerSaberHit() {
        const drohne = this.saber.drohne;
        
        drohne.hit = true;
        drohne.hitTimer = 30;
        this.saber.hits++;
        this.score += 10;
        
        // Update UI
        document.getElementById('score').textContent = `⚔️ ${this.score}`;
        document.getElementById('crystals').textContent = `🎯 ${this.saber.hits}/${this.saber.targetHits}`;
        
        // Explosion effect
        this.explosions.push({
            x: drohne.x,
            y: drohne.y,
            size: 0,
            maxSize: 60,
            alpha: 1,
            color: '#00FF00'
        });
        
        // Check level complete
        if (this.saber.hits >= this.saber.targetHits) {
            this.saberNextLevel();
        }
    },
    
    saberNextLevel() {
        this.saber.level++;
        
        if (this.saber.level > this.saberMissions.length) {
            // All levels complete!
            setTimeout(() => this.celebrateSaber(), 1000);
        } else {
            // Next level
            this.saber.hits = 0;
            this.saber.targetHits = this.saberMissions[this.saber.level - 1].target;
            
            setTimeout(() => {
                this.showSaberMission();
                document.getElementById('crystals').textContent = `🎯 0/${this.saber.targetHits}`;
            }, 1500);
        }
    },
    
    celebrateSaber() {
        // Guard against stale timeouts: if the player went to menu and
        // started a new game before the 1s delay, saber.level was reset to 1.
        if (this.saber.level <= this.saberMissions.length) return;
        this.isRunning = false;
        
        const celebrationEl = document.getElementById('celebration');
        const textEl = document.getElementById('celebration-text');
        const titleEl = celebrationEl.querySelector('h1');
        
        titleEl.textContent = '⚔️ STERNENKAPITÄN-MEISTER! ⚔️';
        textEl.textContent = `${this.pilotName} hat das Energieklinge-Training gemeistert!\n⚔️ ${this.score} Punkte | 🎯 ${this.saber.hits} Treffer`;
        
        celebrationEl.classList.remove('hidden');
    },
    
    spawnForceObjects() {
        this.force.objects = [];
        const mission = this.forceMissions[this.force.level - 1];
        
        // Set target zone based on level
        this.force.targetZone.x = this.width * 0.85;
        this.force.targetZone.y = this.height * 0.25;
        
        if (mission.objectType === 'rock') {
            // Spawn rocks at bottom - BIGGER rocks for easier grabbing!
            for (let i = 0; i < mission.target + 2; i++) {
                this.force.objects.push({
                    type: 'rock',
                    x: 100 + Math.random() * (this.width * 0.5),
                    y: this.height * 0.65 + Math.random() * (this.height * 0.15),
                    size: 70 + Math.random() * 40,  // Much bigger: 70-110px instead of 40-70px
                    rotation: Math.random() * Math.PI * 2,
                    isHeld: false,
                    isPlaced: false,
                    velocityY: 0
                });
            }
        } else if (mission.objectType === 'jaeger') {
            // The legendary Sternjäger in the swamp - JUST the ship, no rocks!
            this.force.objects.push({
                type: 'jaeger',
                x: this.width * 0.3,
                y: this.height * 0.7,
                size: 120,  // Bigger Sternjäger
                rotation: -0.2,
                isHeld: false,
                isPlaced: false,
                velocityY: 0,
                sinking: true
            });
            // No extra rocks - focus on the Sternjäger!
        }
    },
    
    showForceMission() {
        const mission = this.forceMissions[this.force.level - 1];
        const msgEl = document.getElementById('mission-message');
        msgEl.textContent = mission.message;
        msgEl.classList.remove('hidden');
        
        setTimeout(() => {
            msgEl.classList.add('hidden');
        }, 3000);
    },
    
    setupForceTouchControls() {
        const canvas = this.canvas;
        let touchStartObj = null;
        
        const findObjectAtPoint = (x, y) => {
            for (let obj of this.force.objects) {
                if (obj.isPlaced) continue;
                const dist = Math.hypot(obj.x - x, obj.y - y);
                if (dist < obj.size) {
                    return obj;
                }
            }
            return null;
        };
        
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const obj = findObjectAtPoint(touch.clientX, touch.clientY);
            if (obj) {
                obj.isHeld = true;
                this.force.heldObject = obj;
                touchStartObj = obj;
            }
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.force.heldObject) {
                const touch = e.touches[0];
                this.force.heldObject.x = touch.clientX;
                this.force.heldObject.y = touch.clientY;
            }
        });
        
        canvas.addEventListener('touchend', (e) => {
            if (this.force.heldObject) {
                this.force.heldObject.isHeld = false;
                this.checkForcePlacement(this.force.heldObject);
                this.force.heldObject = null;
            }
        });
        
        // Mouse controls for desktop
        canvas.addEventListener('mousedown', (e) => {
            const obj = findObjectAtPoint(e.clientX, e.clientY);
            if (obj) {
                obj.isHeld = true;
                this.force.heldObject = obj;
            }
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (this.force.heldObject) {
                this.force.heldObject.x = e.clientX;
                this.force.heldObject.y = e.clientY;
            }
        });
        
        canvas.addEventListener('mouseup', (e) => {
            if (this.force.heldObject) {
                this.force.heldObject.isHeld = false;
                this.checkForcePlacement(this.force.heldObject);
                this.force.heldObject = null;
            }
        });
    },
    
    checkForcePlacement(obj) {
        const dist = Math.hypot(obj.x - this.force.targetZone.x, obj.y - this.force.targetZone.y);
        if (dist < this.force.targetZone.radius + obj.size / 2) {
            // Placed in target zone!
            obj.isPlaced = true;
            obj.x = this.force.targetZone.x + (Math.random() - 0.5) * 40;
            obj.y = this.force.targetZone.y + (Math.random() - 0.5) * 40;
            
            this.force.objectsPlaced++;
            const mission = this.forceMissions[this.force.level - 1];
            
            // Update score
            const points = obj.type === 'jaeger' ? 50 : 10;
            this.score += points;
            document.getElementById('score').textContent = `✨ ${this.score}`;
            document.getElementById('crystals').textContent = `🪨 ${this.force.objectsPlaced}/${mission.target}`;
            
            // Create force explosion effect
            this.explosions.push({
                x: obj.x,
                y: obj.y,
                size: 0,
                maxSize: 80,
                alpha: 1,
                color: '#00FF88'
            });
            
            // Check if level complete
            if (this.force.objectsPlaced >= mission.target) {
                this.forceNextLevel();
            }
        }
    },
    
    forceNextLevel() {
        this.force.level++;
        
        if (this.force.level > this.forceMissions.length) {
            // Sternjäger lifted! Start takeoff sequence!
            this.startJaegerTakeoff();
        } else {
            // Next level
            this.force.objectsPlaced = 0;
            setTimeout(() => {
                this.spawnForceObjects();
                this.showForceMission();
            }, 1500);
        }
    },
    
    startJaegerTakeoff() {
        // Find the Sternjäger object
        const jaegerObj = this.force.objects.find(obj => obj.type === 'jaeger');
        if (!jaegerObj) {
            this.transitionToFlying();
            return;
        }
        
        // Show takeoff message
        const msgEl = document.getElementById('mission-message');
        msgEl.textContent = '🚀 Sternjäger startet... Bereit zum Fliegen!';
        msgEl.classList.remove('hidden');
        
        // Animate Sternjäger takeoff
        this.force.takeoffPhase = 'rising';
        this.force.takeoffJaeger = jaegerObj;
        jaegerObj.isPlaced = false; // Allow it to move again
        
        // Takeoff animation loop
        const takeoffAnimation = () => {
            if (this.force.takeoffPhase === 'rising') {
                // Rise up
                jaegerObj.y -= 8;
                jaegerObj.rotation = jaegerObj.rotation * 0.95; // Straighten out
                
                // Add engine particles
                this.explosions.push({
                    x: jaegerObj.x + (Math.random() - 0.5) * 30,
                    y: jaegerObj.y + 50,
                    size: 5,
                    maxSize: 20,
                    alpha: 1,
                    color: '#FF6600'
                });
                
                if (jaegerObj.y < this.height * 0.3) {
                    this.force.takeoffPhase = 'accelerating';
                }
                requestAnimationFrame(takeoffAnimation);
            } else if (this.force.takeoffPhase === 'accelerating') {
                // Accelerate upward
                jaegerObj.y -= 15;
                
                // More engine particles
                for (let i = 0; i < 3; i++) {
                    this.explosions.push({
                        x: jaegerObj.x + (Math.random() - 0.5) * 40,
                        y: jaegerObj.y + 60,
                        size: 10,
                        maxSize: 30,
                        alpha: 1,
                        color: '#FF4400'
                    });
                }
                
                if (jaegerObj.y < -100) {
                    // Sternjäger has left the screen!
                    this.force.takeoffPhase = 'complete';
                    msgEl.classList.add('hidden');
                    setTimeout(() => this.transitionToFlying(), 500);
                } else {
                    requestAnimationFrame(takeoffAnimation);
                }
            }
        };
        
        // Start animation after a brief pause
        setTimeout(takeoffAnimation, 1000);
    },
    
    transitionToFlying() {
        // Show transition message
        const msgEl = document.getElementById('mission-message');
        msgEl.textContent = '⭐ Jetzt fliegst DU im Sternjäger! Sammle Kristalle!';
        msgEl.classList.remove('hidden');
        
        setTimeout(() => {
            msgEl.classList.add('hidden');
            
            // Switch to Sternjäger flying mode
            this.gameMode = 'jaeger';
            this.crystals = 0;
            this.currentMission = 0;
            this.collectibles = [];
            this.force.objects = []; // Clear force objects
            this.force.heldObject = null;
            this.force.takeoffPhase = null;
            
            // Reset UI for flying mode
            document.getElementById('score').textContent = `⭐ ${this.score}`;
            document.getElementById('crystals').textContent = '💎 0';
            
            // Initialize Sternjäger position (coming from top)
            this.jaeger.x = this.width / 2;
            this.jaeger.y = -50;
            this.jaeger.targetX = this.width / 2;
            this.jaeger.targetY = this.height * 0.7;
            
            // Create fresh stars for space
            this.createStars();
            
            // Make sure game loop is running
            this.isRunning = true;

            // Setup flying controls (includes Schattenmond hit detection)
            this.setupFlyingControls();

            // Show flying mission
            this.showMission();

            // Start spawning collectibles
            this.spawnLoop();
        }, 2000);
    },
    
    setupFlyingControls() {
        const canvas = this.canvas;
        
        // Remove old listeners by cloning canvas (clean slate)
        const newCanvas = canvas.cloneNode(true);
        canvas.parentNode.replaceChild(newCanvas, canvas);
        this.canvas = newCanvas;
        this.ctx = newCanvas.getContext('2d');
        
        // Touch/mouse move for Sternjäger (touch mode only)
        if (this.controlMode === 'touch') {
            const handleMove = (x, y) => {
                this.jaeger.targetX = x;
                this.jaeger.targetY = Math.min(y, this.height * 0.85);
            };
            
            newCanvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                handleMove(touch.clientX, touch.clientY);
            });
            
            newCanvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                handleMove(touch.clientX, touch.clientY);
                // Schattenmond treffen beim Ziehen
                if (this.schattenmond.active && !this.schattenmond.defeated) {
                    this.hitSchattenmond(touch.clientX, touch.clientY);
                }
            });
            
            newCanvas.addEventListener('mousedown', (e) => {
                handleMove(e.clientX, e.clientY);
            });
            
            newCanvas.addEventListener('mousemove', (e) => {
                if (e.buttons === 1) {
                    handleMove(e.clientX, e.clientY);
                    // Schattenmond treffen beim Ziehen
                    if (this.schattenmond.active && !this.schattenmond.defeated) {
                        this.hitSchattenmond(e.clientX, e.clientY);
                    }
                }
            });
        }
        
        // Klicken/Tippen zum Sammeln und Schattenmond treffen
        newCanvas.addEventListener('click', (e) => {
            this.checkTapCollect(e.clientX, e.clientY);
            this.hitSchattenmond(e.clientX, e.clientY);
        });
        
        newCanvas.addEventListener('touchend', (e) => {
            if (e.changedTouches.length > 0) {
                const touch = e.changedTouches[0];
                this.checkTapCollect(touch.clientX, touch.clientY);
                this.hitSchattenmond(touch.clientX, touch.clientY);
            }
        });
        
        // Schattenmond reiben (alle Modi)
        newCanvas.addEventListener('touchmove', (e) => {
            if (this.schattenmond.active && !this.schattenmond.defeated) {
                e.preventDefault();
                const touch = e.touches[0];
                this.hitSchattenmond(touch.clientX, touch.clientY);
            }
        });
        
        newCanvas.addEventListener('mousemove', (e) => {
            if (e.buttons === 1 && this.schattenmond.active && !this.schattenmond.defeated) {
                this.hitSchattenmond(e.clientX, e.clientY);
            }
        });
    },
    
    createStars() {
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 2 + 1,
                brightness: Math.random()
            });
        }
    },
    
    async setupCamera(forceMode = false) {
        const videoElement = document.getElementById('camera');
        const cameraContainer = document.getElementById('camera-container');
        
        try {
            // Only setup if not already initialized
            if (this.cameraInitialized) {
                cameraContainer.classList.remove('hidden');
                return;
            }
            
            this.hands = new Hands({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`
            });
            
            this.hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 0,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
            
            this.hands.onResults((results) => {
                if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                    const hand = results.multiHandLandmarks[0];
                    // Use wrist position for smoother control
                    this.handX = 1 - hand[0].x; // Mirror
                    this.handY = hand[0].y;
                    
                    // Detect hand open/closed for Force mode
                    if (forceMode || this.gameMode === 'force') {
                        // Check distance between fingertips and palm
                        const palmBase = hand[0]; // wrist
                        const middleTip = hand[12]; // middle finger tip
                        const indexTip = hand[8]; // index finger tip
                        
                        const fingerDist = Math.hypot(middleTip.x - palmBase.x, middleTip.y - palmBase.y);
                        this.handOpen = fingerDist > 0.2; // Adjust threshold as needed
                        
                        // Handle Force object pickup/drop
                        this.handleForceGesture();
                    }
                }
            });
            
            this.camera = new Camera(videoElement, {
                onFrame: async () => {
                    await this.hands.send({ image: videoElement });
                },
                width: 320,
                height: 240
            });
            
            await this.camera.start();
            cameraContainer.classList.remove('hidden');
            this.cameraInitialized = true;
            
        } catch (err) {
            console.error('Camera error:', err);
            // Fallback to touch
            this.controlMode = 'touch';
            if (this.gameMode === 'force') {
                this.setupForceTouchControls();
            } else {
                this.setupTouchControls();
            }
        }
    },
    
    handleForceGesture() {
        const handScreenX = this.handX * this.width;
        const handScreenY = this.handY * this.height;
        
        if (this.handOpen) {
            // Hand open - try to grab nearby object
            if (!this.force.heldObject) {
                for (let obj of this.force.objects) {
                    if (obj.isPlaced) continue;
                    const dist = Math.hypot(obj.x - handScreenX, obj.y - handScreenY);
                    // Bigger grab radius for easier pickup!
                    if (dist < obj.size * 2.5) {
                        obj.isHeld = true;
                        this.force.heldObject = obj;
                        break;
                    }
                }
            } else {
                // Move held object towards hand
                this.force.heldObject.x += (handScreenX - this.force.heldObject.x) * 0.15;
                this.force.heldObject.y += (handScreenY - this.force.heldObject.y) * 0.15;
            }
        } else {
            // Hand closed - release object
            if (this.force.heldObject) {
                this.force.heldObject.isHeld = false;
                this.checkForcePlacement(this.force.heldObject);
                this.force.heldObject = null;
            }
        }
    },
    
    setupTouchControls() {
        const canvas = this.canvas;
        
        const handleMove = (x, y) => {
            this.jaeger.targetX = x;
            this.jaeger.targetY = Math.min(y, this.height * 0.85);
        };
        
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            handleMove(touch.clientX, touch.clientY);
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            handleMove(touch.clientX, touch.clientY);
        });
        
        canvas.addEventListener('mousedown', (e) => {
            handleMove(e.clientX, e.clientY);
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (e.buttons === 1) {
                handleMove(e.clientX, e.clientY);
            }
        });
        
        // Tippen zum Sammeln oder Schattenmond treffen
        canvas.addEventListener('click', (e) => {
            this.checkTapCollect(e.clientX, e.clientY);
            this.hitSchattenmond(e.clientX, e.clientY);
        });
        
        canvas.addEventListener('touchend', (e) => {
            if (e.changedTouches.length > 0) {
                const touch = e.changedTouches[0];
                this.checkTapCollect(touch.clientX, touch.clientY);
                this.hitSchattenmond(touch.clientX, touch.clientY);
            }
        });
        
        // Reiben für Schattenmond
        canvas.addEventListener('touchmove', (e) => {
            if (this.schattenmond.active && !this.schattenmond.defeated) {
                const touch = e.touches[0];
                this.hitSchattenmond(touch.clientX, touch.clientY);
            }
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (e.buttons === 1 && this.schattenmond.active && !this.schattenmond.defeated) {
                this.hitSchattenmond(e.clientX, e.clientY);
            }
        });
    },
    
    checkTapCollect(tapX, tapY) {
        // Check if tap is near any collectible
        const tapRadius = 80;
        this.collectibles.forEach(item => {
            const dist = Math.hypot(item.x - tapX, item.y - tapY);
            if (dist < tapRadius && !item.collected) {
                this.collectItem(item);
            }
        });
    },
    
    showMission() {
        const mission = this.missions[this.currentMission];
        const msgEl = document.getElementById('mission-message');
        msgEl.textContent = mission.message;
        msgEl.classList.remove('hidden');
        
        setTimeout(() => {
            msgEl.classList.add('hidden');
        }, 2500);
    },
    
    spawnLoop() {
        if (!this.isRunning) return;
        if (this.gameMode !== 'jaeger') return;
        
        // Spawn collectibles
        this.spawnCollectible();
        
        // Slower spawn rate for kids: was 800-1500ms, now 1200-2200ms
        const interval = 1200 + Math.random() * 1000;
        setTimeout(() => this.spawnLoop(), interval);
    },
    
    spawnCollectible() {
        const types = ['crystal', 'crystal', 'star', 'star', 'star', 'powerup'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        this.collectibles.push({
            type: type,
            x: Math.random() * (this.width - 100) + 50,
            y: -50,
            size: type === 'powerup' ? 60 : 50,  // Bigger objects for kids
            speed: 1 + Math.random() * 1.5,  // Slower: was 2-4, now 1-2.5
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            collected: false,
            alpha: 1
        });
    },
    
    collectItem(item) {
        if (item.collected) return;
        
        item.collected = true;
        
        // Add points
        let points = 0;
        if (item.type === 'crystal') {
            points = 5;
            this.crystals++;
            document.getElementById('crystals').textContent = `💎 ${this.crystals}`;
        } else if (item.type === 'star') {
            points = 3;
        } else if (item.type === 'powerup') {
            points = 10;
        }
        
        this.score += points;
        document.getElementById('score').textContent = `⭐ ${this.score}`;
        
        // Create explosion effect
        this.explosions.push({
            x: item.x,
            y: item.y,
            size: 0,
            maxSize: 60,
            alpha: 1,
            color: item.type === 'crystal' ? '#00BFFF' : '#FFE81F'
        });
        
        // Check mission progress
        this.checkMissionProgress();
    },
    
    checkMissionProgress() {
        if (this.schattenmond.active) return; // Kein Check während Bosskampf
        if (this.gameMode !== 'jaeger') return; // Only check in Sternjäger mode
        
        const mission = this.missions[this.currentMission];
        if (!mission) return; // Safety check
        
        let progress = 0;
        
        if (mission.type === 'crystals') {
            progress = this.crystals;
        } else if (mission.type === 'stars') {
            progress = Math.floor(this.score / 3);
        } else if (mission.type === 'total') {
            progress = this.score;
        } else if (mission.type === 'boss') {
            // Already on boss mission, spawn it if not active
            if (!this.schattenmond.active) {
                setTimeout(() => this.spawnDeathStar(), 500);
            }
            return;
        }
        
        if (progress >= mission.target) {
            // Mission complete!
            this.currentMission++;
            
            // Check if next mission is boss
            const nextMission = this.missions[this.currentMission];
            if (!nextMission) {
                // No more missions - this shouldn't happen
                this.celebrate();
            } else if (nextMission.type === 'boss') {
                // Schattenmond naht!
                console.log('Schattenmond erscheint!');
                setTimeout(() => this.spawnDeathStar(), 1500);
            } else {
                // Show next mission
                setTimeout(() => this.showMission(), 1000);
            }
        }
    },
    
    spawnDeathStar() {
        // Stop spawning collectibles
        this.collectibles = [];
        
        // Show boss message
        this.showMission();
        
        // Schattenmond aktivieren
        this.schattenmond.active = true;
        this.schattenmond.x = this.width / 2;
        this.schattenmond.y = -200;
        this.schattenmond.health = this.schattenmond.maxHealth;
        this.schattenmond.hits = 0;
        this.schattenmond.defeated = false;
        this.schattenmond.targetY = this.height * 0.3;
    },
    
    hitSchattenmond(x, y) {
        if (!this.schattenmond.active || this.schattenmond.defeated) return;
        
        // Rate limit hits (max 5 per second)
        const now = Date.now();
        if (this.schattenmond.lastHit && now - this.schattenmond.lastHit < 200) return;
        this.schattenmond.lastHit = now;
        
        const dist = Math.hypot(x - this.schattenmond.x, y - this.schattenmond.y);
        if (dist < this.schattenmond.size) {
            this.schattenmond.hits++;
            this.schattenmond.health--;
            this.schattenmond.shaking = true;
            setTimeout(() => this.schattenmond.shaking = false, 100);
            
            // Add hit explosion
            this.explosions.push({
                x: x + (Math.random() - 0.5) * 50,
                y: y + (Math.random() - 0.5) * 50,
                size: 0,
                maxSize: 40,
                alpha: 1,
                color: '#FF4400'
            });
            
            // Add score
            this.score += 5;
            document.getElementById('score').textContent = `⭐ ${this.score}`;
            
            if (this.schattenmond.health <= 0) {
                this.destroyDeathStar();
            }
        }
    },
    
    destroyDeathStar() {
        this.schattenmond.defeated = true;
        
        // Epic explosion sequence
        const explodeSequence = (count) => {
            if (count <= 0) {
                // Final big explosion
                for (let i = 0; i < 20; i++) {
                    this.explosions.push({
                        x: this.schattenmond.x + (Math.random() - 0.5) * 200,
                        y: this.schattenmond.y + (Math.random() - 0.5) * 200,
                        size: 0,
                        maxSize: 80 + Math.random() * 60,
                        alpha: 1,
                        color: ['#FF4400', '#FF6600', '#FFAA00', '#FFFFFF'][Math.floor(Math.random() * 4)]
                    });
                }
                
                // Victory!
                setTimeout(() => {
                    this.schattenmond.active = false;
                    this.victorySequence();
                }, 1500);
                return;
            }
            
            // Add explosions
            for (let i = 0; i < 3; i++) {
                this.explosions.push({
                    x: this.schattenmond.x + (Math.random() - 0.5) * this.schattenmond.size,
                    y: this.schattenmond.y + (Math.random() - 0.5) * this.schattenmond.size,
                    size: 0,
                    maxSize: 50 + Math.random() * 30,
                    alpha: 1,
                    color: '#FF6600'
                });
            }
            
            setTimeout(() => explodeSequence(count - 1), 200);
        };
        
        explodeSequence(10);
    },
    
    victorySequence() {
        const msgEl = document.getElementById('mission-message');
        msgEl.textContent = '🎉 DER SCHATTENMOND IST ZERSTÖRT! 🎉';
        msgEl.classList.remove('hidden');
        
        // Create fireworks
        const fireworks = setInterval(() => {
            for (let i = 0; i < 5; i++) {
                this.explosions.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height * 0.6,
                    size: 0,
                    maxSize: 60 + Math.random() * 40,
                    alpha: 1,
                    color: ['#FF0000', '#00FF00', '#0088FF', '#FFFF00', '#FF00FF'][Math.floor(Math.random() * 5)]
                });
            }
        }, 300);
        
        setTimeout(() => {
            clearInterval(fireworks);
            msgEl.classList.add('hidden');
            this.celebrate();
        }, 4000);
    },
    
    celebrate() {
        this.isRunning = false;
        
        const celebrationEl = document.getElementById('celebration');
        const textEl = document.getElementById('celebration-text');
        const titleEl = celebrationEl.querySelector('h1');
        
        if (this.gameMode === 'force') {
            titleEl.textContent = '🎉 SUPER GEMACHT! 🎉';
            textEl.textContent = `${this.pilotName} hat die Sternenkraft gemeistert! ✨ ${this.score} Punkte!`;
        } else if (this.schattenmond.defeated) {
            titleEl.textContent = '🏆 GALAXIS GERETTET! 🏆';
            textEl.textContent = `${this.pilotName} hat den Schattenmond zerstört!\n⭐ ${this.score} Punkte | 💎 ${this.crystals} Kristalle`;
        } else {
            titleEl.textContent = '🎉 SUPER GEMACHT! 🎉';
            textEl.textContent = `${this.pilotName} hat ${this.score} Punkte und ${this.crystals} Kristalle gesammelt!`;
        }
        celebrationEl.classList.remove('hidden');
    },
    
    resetGame() {
        // Reset state
        this.score = 0;
        this.crystals = 0;
        this.currentMission = 0;
        this.collectibles = [];
        this.explosions = [];
        this.force.level = 1;
        this.force.objectsPlaced = 0;
        this.force.heldObject = null;
        this.force.objects = [];
        this.saber.hits = 0;
        this.saber.level = 1;
        this.saber.blindMode = false;
        
        // Update UI based on game mode
        if (this.gameMode === 'saber') {
            document.getElementById('score').textContent = '⚔️ 0';
            document.getElementById('crystals').textContent = `🎯 0/${this.saberMissions[0].target}`;
        } else if (this.gameMode === 'force') {
            document.getElementById('score').textContent = '✨ 0';
            document.getElementById('crystals').textContent = `🪨 0/${this.forceMissions[0].target}`;
        } else {
            document.getElementById('score').textContent = '⭐ 0';
            document.getElementById('crystals').textContent = '💎 0';
        }
        document.getElementById('celebration').classList.add('hidden');
        
        if (this.gameMode === 'saber') {
            // Reset saber mode
            this.saber.drohne.hit = false;
            this.saber.drohne.x = this.width / 2;
            this.saber.drohne.y = this.height / 3;
            this.saber.targetHits = this.saberMissions[0].target;
            this.saber.klinge.trail = [];
            this.moveRemote();
            this.showSaberMission();
        } else if (this.gameMode === 'force') {
            this.spawnForceObjects();
            this.showForceMission();
        } else {
            // Reset Sternjäger position
            this.jaeger.x = this.width / 2;
            this.jaeger.y = this.height * 0.7;
            this.jaeger.targetX = this.jaeger.x;
            this.jaeger.targetY = this.jaeger.y;
            this.showMission();
            this.spawnLoop();
        }
        
        this.isRunning = true;
        this.gameLoop();
    },
    
    update() {
        if (this.gameMode === 'force') {
            this.updateForceMode();
        } else if (this.gameMode === 'saber') {
            this.updateSaberMode();
        } else {
            this.updateJaegerMode();
        }
        
        // Update explosions
        this.explosions.forEach(exp => {
            exp.size += 5;
            exp.alpha -= 0.05;
        });
        this.explosions = this.explosions.filter(exp => exp.alpha > 0);
    },
    
    updateSaberMode() {
        const drohne = this.saber.drohne;
        const saber = this.saber.klinge;
        
        // Update stars (Millennium Falcon interior atmosphere)
        this.stars.forEach(star => {
            star.brightness = 0.2 + Math.sin(Date.now() * 0.003 + star.x) * 0.1;
        });
        
        // Update drohne position (smooth movement)
        if (!drohne.hit) {
            drohne.x += (drohne.targetX - drohne.x) * 0.02 * drohne.speed;
            drohne.y += (drohne.targetY - drohne.y) * 0.02 * drohne.speed;
            
            // Gentle floating wobble
            drohne.x += Math.sin(Date.now() * 0.005) * 0.5;
            drohne.y += Math.cos(Date.now() * 0.004) * 0.3;
        } else {
            // Hit animation
            drohne.hitTimer--;
            if (drohne.hitTimer <= 0) {
                drohne.hit = false;
                // Move to new position
                drohne.targetX = 100 + Math.random() * (this.width - 200);
                drohne.targetY = 100 + Math.random() * (this.height * 0.4);
            }
        }
        
        // Update laser
        if (drohne.laserActive) {
            drohne.laserTimer--;
            if (drohne.laserTimer <= 0) {
                drohne.laserActive = false;
            }
        }
        
        // Camera mode: update Energieklinge from hand position
        if (this.controlMode === 'camera') {
            saber.prevX = saber.x;
            saber.prevY = saber.y;
            saber.x = this.handX * this.width;
            saber.y = this.handY * this.height;
            
            const dx = saber.x - saber.prevX;
            const dy = saber.y - saber.prevY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                saber.angle = Math.atan2(dy, dx) + Math.PI / 2;
                saber.swinging = true;
                
                saber.trail.push({ x: saber.x, y: saber.y, alpha: 1 });
                if (saber.trail.length > 20) saber.trail.shift();
                
                this.checkSaberHit();
            } else {
                saber.swinging = false;
            }
        }
        
        // Update trail
        saber.trail.forEach(t => {
            t.alpha -= 0.08;
        });
        saber.trail = saber.trail.filter(t => t.alpha > 0);
    },
    
    updateForceMode() {
        // Update stars (slow drift for Nebelplanet atmosphere)
        this.stars.forEach(star => {
            star.y += star.speed * 0.3;
            star.brightness = 0.3 + Math.sin(Date.now() * 0.002 + star.x) * 0.2;
            if (star.y > this.height) {
                star.y = 0;
                star.x = Math.random() * this.width;
            }
        });
        
        // Update force objects
        this.force.objects.forEach(obj => {
            if (!obj.isHeld && !obj.isPlaced) {
                // Apply gravity
                obj.velocityY += 0.3;
                obj.y += obj.velocityY;
                
                // Ground collision
                const ground = this.height * 0.85;
                if (obj.y > ground) {
                    obj.y = ground;
                    obj.velocityY = -obj.velocityY * 0.3;
                    if (Math.abs(obj.velocityY) < 1) obj.velocityY = 0;
                }
            } else if (obj.isHeld) {
                obj.velocityY = 0;
                // Gentle floating wobble
                obj.rotation += 0.02;
            }
        });
        
        // Update force beam
        if (this.force.heldObject && this.controlMode === 'camera') {
            this.force.forceBeam = {
                startX: this.handX * this.width,
                startY: this.handY * this.height,
                endX: this.force.heldObject.x,
                endY: this.force.heldObject.y
            };
        } else {
            this.force.forceBeam = null;
        }
    },
    
    updateJaegerMode() {
        // Update Sternjäger position based on control mode
        if (this.controlMode === 'camera') {
            this.jaeger.targetX = this.handX * this.width;
            this.jaeger.targetY = this.handY * this.height * 0.8 + this.height * 0.1;
        }
        
        // Smooth movement
        this.jaeger.x += (this.jaeger.targetX - this.jaeger.x) * this.jaeger.speed;
        this.jaeger.y += (this.jaeger.targetY - this.jaeger.y) * this.jaeger.speed;
        
        // Keep Sternjäger on screen
        this.jaeger.x = Math.max(this.jaeger.width / 2, Math.min(this.width - this.jaeger.width / 2, this.jaeger.x));
        this.jaeger.y = Math.max(this.jaeger.height / 2, Math.min(this.height - this.jaeger.height / 2, this.jaeger.y));
        
        // Update stars (scrolling down)
        this.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > this.height) {
                star.y = 0;
                star.x = Math.random() * this.width;
            }
            star.brightness = 0.5 + Math.sin(Date.now() * 0.01 + star.x) * 0.5;
        });
        
        // Update collectibles
        this.collectibles.forEach(item => {
            if (!item.collected) {
                item.y += item.speed;
                item.rotation += item.rotationSpeed;
                
                // Check collision with Sternjäger
                const dist = Math.hypot(item.x - this.jaeger.x, item.y - this.jaeger.y);
                if (dist < (item.size + this.jaeger.width) / 2) {
                    this.collectItem(item);
                }
            } else {
                // Fade out collected items
                item.alpha -= 0.1;
            }
        });
        
        // Remove off-screen or faded items
        this.collectibles = this.collectibles.filter(item => 
            item.y < this.height + 100 && item.alpha > 0
        );
        
        // Schattenmond aktualisieren
        if (this.schattenmond.active && !this.schattenmond.defeated) {
            // Move into position
            if (this.schattenmond.y < this.schattenmond.targetY) {
                this.schattenmond.y += 2;
            }
            
            // Gentle floating
            this.schattenmond.y += Math.sin(Date.now() * 0.002) * 0.5;
            
            // Sternjäger kollidiert mit Schattenmond!
            const dist = Math.hypot(this.jaeger.x - this.schattenmond.x, this.jaeger.y - this.schattenmond.y);
            if (dist < this.schattenmond.size + this.jaeger.width / 2) {
                this.hitSchattenmond(this.jaeger.x, this.jaeger.y);
            }
        }
    },
    
    draw() {
        const ctx = this.ctx;
        
        if (this.gameMode === 'force') {
            this.drawForceMode(ctx);
        } else if (this.gameMode === 'saber') {
            this.drawSaberMode(ctx);
        } else {
            this.drawJaegerMode(ctx);
        }
    },
    
    drawSaberMode(ctx) {
        // Training room interior background
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw dim lights (interior atmosphere)
        this.stars.forEach(star => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(100, 150, 200, ${star.brightness})`;
            ctx.fill();
        });
        
        // Draw floor grid (training room)
        ctx.strokeStyle = 'rgba(100, 100, 150, 0.2)';
        ctx.lineWidth = 1;
        for (let y = this.height * 0.6; y < this.height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }
        
        // Draw wall panels
        ctx.fillStyle = '#2a2a3e';
        ctx.fillRect(0, 0, 30, this.height);
        ctx.fillRect(this.width - 30, 0, 30, this.height);
        
        // Blind mode overlay
        if (this.saber.blindMode) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, this.width, this.height);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🙈 Vertraue der Sternenkraft!', this.width / 2, 50);
        }
        
        // Draw training drohne
        this.drawTrainingRemote(ctx);
        
        // Draw drohne laser
        if (this.saber.drohne.laserActive) {
            this.drawRemoteLaser(ctx);
        }
        
        // Draw Energieklinge trail
        const saber = this.saber.klinge;
        ctx.lineCap = 'round';
        saber.trail.forEach((t, i) => {
            if (i > 0) {
                const prev = saber.trail[i - 1];
                ctx.beginPath();
                ctx.moveTo(prev.x, prev.y);
                ctx.lineTo(t.x, t.y);
                ctx.strokeStyle = `rgba(0, 255, 0, ${t.alpha * 0.5})`;
                ctx.lineWidth = 8;
                ctx.stroke();
            }
        });
        
        // Draw Energieklinge
        this.drawEnergieklinge(ctx);
        
        // Draw explosions
        this.explosions.forEach(exp => {
            ctx.beginPath();
            ctx.arc(exp.x, exp.y, exp.size, 0, Math.PI * 2);
            ctx.fillStyle = `${exp.color}${Math.floor(exp.alpha * 255).toString(16).padStart(2, '0')}`;
            ctx.fill();
        });
        
        // Draw hand indicator (camera mode, non-blind)
        if (this.controlMode === 'camera' && !this.saber.blindMode) {
            const hx = this.handX * this.width;
            const hy = this.handY * this.height;
            
            ctx.beginPath();
            ctx.arc(hx, hy, 15, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    },
    
    drawTrainingRemote(ctx) {
        const drohne = this.saber.drohne;
        
        // Don't draw in blind mode (but still functional!)
        if (this.saber.blindMode && !drohne.hit) {
            // Only show hint when close
            const saber = this.saber.klinge;
            const dist = Math.hypot(saber.x - drohne.x, saber.y - drohne.y);
            if (dist < 150) {
                ctx.fillStyle = `rgba(255, 255, 0, ${0.3 * (1 - dist / 150)})`;
                ctx.beginPath();
                ctx.arc(drohne.x, drohne.y, 30, 0, Math.PI * 2);
                ctx.fill();
            }
            return;
        }
        
        ctx.save();
        ctx.translate(drohne.x, drohne.y);
        
        // Shake when hit
        if (drohne.hit) {
            ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
        }
        
        // Main sphere (training drohne body)
        const gradient = ctx.createRadialGradient(-10, -10, 0, 0, 0, drohne.size);
        gradient.addColorStop(0, '#888888');
        gradient.addColorStop(0.5, '#555555');
        gradient.addColorStop(1, '#333333');
        
        ctx.beginPath();
        ctx.arc(0, 0, drohne.size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Equator band
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(0, 0, drohne.size, drohne.size * 0.15, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Sensor eye (red)
        ctx.fillStyle = drohne.hit ? '#00FF00' : '#FF0000';
        ctx.shadowColor = drohne.hit ? '#00FF00' : '#FF0000';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(drohne.size * 0.3, -drohne.size * 0.2, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Small antenna
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -drohne.size);
        ctx.lineTo(0, -drohne.size - 15);
        ctx.stroke();
        
        // Antenna tip
        ctx.fillStyle = '#AAAAAA';
        ctx.beginPath();
        ctx.arc(0, -drohne.size - 15, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Hover glow
        ctx.beginPath();
        ctx.arc(0, drohne.size + 10, 20, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 150, 255, 0.2)';
        ctx.fill();
        
        ctx.restore();
    },
    
    drawRemoteLaser(ctx) {
        const drohne = this.saber.drohne;
        const laserLength = 200;
        
        const endX = drohne.x + Math.cos(drohne.laserAngle) * laserLength;
        const endY = drohne.y + Math.sin(drohne.laserAngle) * laserLength;
        
        // Laser beam
        ctx.beginPath();
        ctx.moveTo(drohne.x, drohne.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Core
        ctx.beginPath();
        ctx.moveTo(drohne.x, drohne.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#FFAAAA';
        ctx.lineWidth = 2;
        ctx.stroke();
    },
    
    drawEnergieklinge(ctx) {
        const saber = this.saber.klinge;
        
        ctx.save();
        ctx.translate(saber.x, saber.y);
        ctx.rotate(saber.angle);
        
        // Hilt (handle)
        ctx.fillStyle = '#666666';
        ctx.fillRect(-8, -10, 16, 40);
        
        // Hilt details
        ctx.fillStyle = '#444444';
        ctx.fillRect(-10, 5, 20, 8);
        ctx.fillRect(-10, 18, 20, 8);
        
        // Emitter
        ctx.fillStyle = '#888888';
        ctx.fillRect(-6, -15, 12, 8);
        
        // Blade (only when swinging or always?)
        ctx.shadowColor = '#00FF00';
        ctx.shadowBlur = 30;
        
        // Blade glow
        const bladeGradient = ctx.createLinearGradient(0, -saber.length, 0, -20);
        bladeGradient.addColorStop(0, 'rgba(0, 255, 0, 0.8)');
        bladeGradient.addColorStop(1, 'rgba(150, 255, 150, 1)');
        
        ctx.fillStyle = bladeGradient;
        ctx.beginPath();
        ctx.moveTo(-4, -15);
        ctx.lineTo(-3, -saber.length + 10);
        ctx.quadraticCurveTo(0, -saber.length, 3, -saber.length + 10);
        ctx.lineTo(4, -15);
        ctx.closePath();
        ctx.fill();
        
        // Blade core (white)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.moveTo(-2, -15);
        ctx.lineTo(-1, -saber.length + 15);
        ctx.quadraticCurveTo(0, -saber.length + 5, 1, -saber.length + 15);
        ctx.lineTo(2, -15);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.restore();
    },
    
    drawForceMode(ctx) {
        // Nebelplanet swamp background
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#1a2f1a');
        gradient.addColorStop(0.6, '#2d4a2d');
        gradient.addColorStop(1, '#1a3a2a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw dim stars (through fog)
        this.stars.forEach(star => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * 0.7, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 255, 200, ${star.brightness * 0.5})`;
            ctx.fill();
        });
        
        // Draw swamp ground
        ctx.fillStyle = '#1a3020';
        ctx.beginPath();
        ctx.moveTo(0, this.height * 0.8);
        for (let x = 0; x <= this.width; x += 50) {
            ctx.lineTo(x, this.height * 0.8 + Math.sin(x * 0.02) * 20);
        }
        ctx.lineTo(this.width, this.height);
        ctx.lineTo(0, this.height);
        ctx.closePath();
        ctx.fill();
        
        // Draw swamp water
        ctx.fillStyle = 'rgba(30, 60, 40, 0.7)';
        ctx.fillRect(0, this.height * 0.85, this.width, this.height * 0.15);
        
        // Draw target zone
        const tz = this.force.targetZone;
        ctx.beginPath();
        ctx.arc(tz.x, tz.y, tz.radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#00FF88';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Target zone glow
        ctx.beginPath();
        ctx.arc(tz.x, tz.y, tz.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 136, 0.1)';
        ctx.fill();
        
        // Target zone label
        ctx.fillStyle = '#00FF88';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ZIEL', tz.x, tz.y + tz.radius + 25);
        
        // Draw force beam
        if (this.force.forceBeam) {
            const fb = this.force.forceBeam;
            ctx.beginPath();
            ctx.moveTo(fb.startX, fb.startY);
            ctx.lineTo(fb.endX, fb.endY);
            ctx.strokeStyle = 'rgba(0, 200, 255, 0.5)';
            ctx.lineWidth = 8;
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Draw force objects
        this.force.objects.forEach(obj => {
            ctx.save();
            ctx.translate(obj.x, obj.y);
            ctx.rotate(obj.rotation);
            
            if (obj.isHeld) {
                // Glowing effect when held
                ctx.shadowColor = '#00BFFF';
                ctx.shadowBlur = 30;
            }
            
            if (obj.type === 'rock') {
                this.drawRock(ctx, obj.size);
            } else if (obj.type === 'jaeger') {
                this.drawJaegerObject(ctx, obj.size);
            }
            
            ctx.restore();
        });
        
        // Draw hand indicator (camera mode)
        if (this.controlMode === 'camera') {
            const hx = this.handX * this.width;
            const hy = this.handY * this.height;
            
            ctx.beginPath();
            ctx.arc(hx, hy, 30, 0, Math.PI * 2);
            ctx.strokeStyle = this.handOpen ? '#00FF88' : '#FF6666';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Hand symbol
            ctx.fillStyle = this.handOpen ? '#00FF88' : '#FF6666';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.handOpen ? '✋' : '✊', hx, hy + 8);
        }
        
        // Draw explosions
        this.explosions.forEach(exp => {
            ctx.beginPath();
            ctx.arc(exp.x, exp.y, exp.size, 0, Math.PI * 2);
            ctx.fillStyle = `${exp.color}${Math.floor(exp.alpha * 255).toString(16).padStart(2, '0')}`;
            ctx.fill();
        });
        
        // Draw fog overlay
        ctx.fillStyle = 'rgba(100, 150, 100, 0.1)';
        ctx.fillRect(0, 0, this.width, this.height);
    },
    
    drawRock(ctx, size) {
        ctx.fillStyle = '#666655';
        ctx.strokeStyle = '#444433';
        ctx.lineWidth = 2;
        
        // Irregular rock shape
        ctx.beginPath();
        const points = 8;
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const r = size / 2 * (0.7 + Math.sin(i * 1.5) * 0.3);
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Rock texture
        ctx.fillStyle = '#555544';
        ctx.beginPath();
        ctx.arc(-size * 0.1, -size * 0.1, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
    },
    
    drawJaegerObject(ctx, size) {
        // Draw Sternjäger (same as flying mode but bigger)
        const scale = size / 80;
        const w = 80 * scale;
        const h = 60 * scale;
        
        // Engine glow
        ctx.shadowColor = '#FF6600';
        ctx.shadowBlur = 15 * scale;
        ctx.fillStyle = '#FF4400';
        ctx.beginPath();
        ctx.ellipse(-w * 0.3, h * 0.1, 6 * scale, 12 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w * 0.3, h * 0.1, 6 * scale, 12 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Wings
        ctx.fillStyle = '#AAAAAA';
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        
        // Left wing
        ctx.beginPath();
        ctx.moveTo(-w * 0.1, -h * 0.1);
        ctx.lineTo(-w * 0.5, -h * 0.4);
        ctx.lineTo(-w * 0.5, h * 0.2);
        ctx.lineTo(-w * 0.1, h * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Right wing
        ctx.beginPath();
        ctx.moveTo(w * 0.1, -h * 0.1);
        ctx.lineTo(w * 0.5, -h * 0.4);
        ctx.lineTo(w * 0.5, h * 0.2);
        ctx.lineTo(w * 0.1, h * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Wing cannons
        ctx.fillStyle = '#FF0000';
        [[-0.5, -0.4], [0.5, -0.4], [-0.5, 0.2], [0.5, 0.2]].forEach(([px, py]) => {
            ctx.beginPath();
            ctx.arc(w * px, h * py, 4 * scale, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Fuselage
        ctx.fillStyle = '#CCCCCC';
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.5);
        ctx.lineTo(w * 0.15, -h * 0.1);
        ctx.lineTo(w * 0.15, h * 0.3);
        ctx.lineTo(0, h * 0.4);
        ctx.lineTo(-w * 0.15, h * 0.3);
        ctx.lineTo(-w * 0.15, -h * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#888';
        ctx.stroke();
        
        // Cockpit
        ctx.fillStyle = '#4488FF';
        ctx.beginPath();
        ctx.ellipse(0, -h * 0.15, w * 0.08, h * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // ROBI (helper robot)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, h * 0.15, w * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0066CC';
        ctx.beginPath();
        ctx.arc(0, h * 0.15, w * 0.03, 0, Math.PI, true);
        ctx.fill();
    },
    
    drawJaegerMode(ctx) {
        // Clear with space background
        ctx.fillStyle = '#000011';
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw stars
        this.stars.forEach(star => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
            ctx.fill();
        });
        
        // Draw collectibles
        this.collectibles.forEach(item => {
            if (item.alpha <= 0) return;
            
            ctx.save();
            ctx.translate(item.x, item.y);
            ctx.rotate(item.rotation);
            ctx.globalAlpha = item.alpha;
            
            if (item.type === 'crystal') {
                this.drawCrystal(ctx, item.size);
            } else if (item.type === 'star') {
                this.drawStar(ctx, item.size);
            } else if (item.type === 'powerup') {
                this.drawPowerup(ctx, item.size);
            }
            
            ctx.restore();
        });
        
        // Draw explosions
        this.explosions.forEach(exp => {
            ctx.beginPath();
            ctx.arc(exp.x, exp.y, exp.size, 0, Math.PI * 2);
            ctx.fillStyle = `${exp.color}${Math.floor(exp.alpha * 255).toString(16).padStart(2, '0')}`;
            ctx.fill();
        });
        
        // Schattenmond zeichnen
        if (this.schattenmond.active) {
            this.drawDeathStar(ctx);
        }
        
        // Draw Sternjäger
        this.drawJaeger(ctx);
    },
    
    drawDeathStar(ctx) {
        const ds = this.schattenmond;
        let x = ds.x;
        let y = ds.y;
        
        // Shake effect when hit
        if (ds.shaking) {
            x += (Math.random() - 0.5) * 20;
            y += (Math.random() - 0.5) * 20;
        }
        
        ctx.save();
        ctx.translate(x, y);
        
        // Main sphere (dark gray)
        const gradient = ctx.createRadialGradient(-ds.size * 0.3, -ds.size * 0.3, 0, 0, 0, ds.size);
        gradient.addColorStop(0, '#666666');
        gradient.addColorStop(0.5, '#444444');
        gradient.addColorStop(1, '#222222');
        
        ctx.beginPath();
        ctx.arc(0, 0, ds.size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Superlaser dish (the indent)
        ctx.beginPath();
        ctx.arc(ds.size * 0.3, -ds.size * 0.2, ds.size * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = '#333333';
        ctx.fill();
        
        // Dish inner circle
        ctx.beginPath();
        ctx.arc(ds.size * 0.3, -ds.size * 0.2, ds.size * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = '#222222';
        ctx.fill();
        
        // Superlaser focus point (green when healthy)
        if (!ds.defeated) {
            ctx.beginPath();
            ctx.arc(ds.size * 0.3, -ds.size * 0.2, ds.size * 0.08, 0, Math.PI * 2);
            ctx.fillStyle = ds.health > ds.maxHealth / 2 ? '#00FF00' : '#FF6600';
            ctx.shadowColor = ds.health > ds.maxHealth / 2 ? '#00FF00' : '#FF6600';
            ctx.shadowBlur = 20;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        // Equator trench
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, ds.size, ds.size * 0.1, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Surface details (panels)
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * ds.size * 0.9, Math.sin(angle) * ds.size * 0.9);
            ctx.stroke();
        }
        
        // Health bar
        if (!ds.defeated) {
            const barWidth = ds.size * 1.5;
            const barHeight = 15;
            const barY = ds.size + 20;
            
            // Background
            ctx.fillStyle = '#333333';
            ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);
            
            // Health
            const healthPercent = ds.health / ds.maxHealth;
            ctx.fillStyle = healthPercent > 0.5 ? '#FF0000' : '#FF6600';
            ctx.fillRect(-barWidth / 2, barY, barWidth * healthPercent, barHeight);
            
            // Border
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.strokeRect(-barWidth / 2, barY, barWidth, barHeight);
            
            // "RUB TO DESTROY" text
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('👆 RUBBELN ZUM ZERSTÖREN!', 0, barY + barHeight + 25);
        }
        
        ctx.restore();
    },
    
    drawJaeger(ctx) {
        const x = this.jaeger.x;
        const y = this.jaeger.y;
        const w = this.jaeger.width;
        const h = this.jaeger.height;
        
        ctx.save();
        ctx.translate(x, y);
        
        // Engine glow
        ctx.shadowColor = '#FF6600';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#FF4400';
        ctx.beginPath();
        ctx.ellipse(-w * 0.3, h * 0.1, 8, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w * 0.3, h * 0.1, 8, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Wings (extended for combat)
        ctx.fillStyle = '#AAAAAA';
        // Left wing
        ctx.beginPath();
        ctx.moveTo(-w * 0.1, -h * 0.1);
        ctx.lineTo(-w * 0.5, -h * 0.4);
        ctx.lineTo(-w * 0.5, h * 0.2);
        ctx.lineTo(-w * 0.1, h * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Right wing
        ctx.beginPath();
        ctx.moveTo(w * 0.1, -h * 0.1);
        ctx.lineTo(w * 0.5, -h * 0.4);
        ctx.lineTo(w * 0.5, h * 0.2);
        ctx.lineTo(w * 0.1, h * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Wing cannons
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(-w * 0.5, -h * 0.4, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w * 0.5, -h * 0.4, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-w * 0.5, h * 0.2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.2, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Fuselage
        ctx.fillStyle = '#CCCCCC';
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.5);
        ctx.lineTo(w * 0.15, -h * 0.1);
        ctx.lineTo(w * 0.15, h * 0.3);
        ctx.lineTo(0, h * 0.4);
        ctx.lineTo(-w * 0.15, h * 0.3);
        ctx.lineTo(-w * 0.15, -h * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#888';
        ctx.stroke();
        
        // Cockpit
        ctx.fillStyle = '#4488FF';
        ctx.beginPath();
        ctx.ellipse(0, -h * 0.15, w * 0.08, h * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2266CC';
        ctx.stroke();
        
        // ROBI dome (helper robot)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, h * 0.15, w * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0066CC';
        ctx.beginPath();
        ctx.arc(0, h * 0.15, w * 0.04, 0, Math.PI, true);
        ctx.fill();
        
        ctx.restore();
    },
    
    drawCrystal(ctx, size) {
        ctx.fillStyle = '#00BFFF';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        
        // Diamond shape
        ctx.beginPath();
        ctx.moveTo(0, -size / 2);
        ctx.lineTo(size / 2, 0);
        ctx.lineTo(0, size / 2);
        ctx.lineTo(-size / 2, 0);
        ctx.closePath();
        
        ctx.shadowColor = '#00BFFF';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.stroke();
        
        // Inner shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(0, -size / 4);
        ctx.lineTo(size / 4, 0);
        ctx.lineTo(0, size / 4);
        ctx.lineTo(-size / 4, 0);
        ctx.closePath();
        ctx.fill();
    },
    
    drawStar(ctx, size) {
        ctx.fillStyle = '#FFE81F';
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * size / 2;
            const y = Math.sin(angle) * size / 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        
        ctx.shadowColor = '#FFE81F';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.stroke();
    },
    
    drawPowerup(ctx, size) {
        // Galactic Alliance symbol (simplified)
        ctx.fillStyle = '#FF6B6B';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.shadowColor = '#FF6B6B';
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.stroke();
        
        // Inner symbol
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(0, -size / 4);
        ctx.lineTo(size / 6, size / 6);
        ctx.lineTo(-size / 6, size / 6);
        ctx.closePath();
        ctx.fill();
    },
    
    gameLoop() {
        if (!this.isRunning) return;
        
        this.update();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
};

// Start when page loads
document.addEventListener('DOMContentLoaded', () => Game.init());
