// Constants
const INITIAL_BALL_SPEED = 7;
const SPEED_INCREMENT = 0.2;
const MAX_BALL_SPEED = 15;
const WINNING_SCORE = 2;

const DIRECTION = {
    IDLE: 0,
    UP: 1,
    DOWN: 2,
    LEFT: 3,
    RIGHT: 4
};

const GAME_STATES = {
    MENU: 0,
    PLAYING: 1,
    GAME_OVER: 2,
    TOURNAMENT_ROUND_END: 3
};

const GAME_MODES = {
    SINGLE_PLAYER: 0,
    TWO_PLAYER: 1,
    MULTIPLAYER: 2,
    TOURNAMENT: 3
};

const TOURNAMENT_ROUNDS = {
    ROUND_1: 0,
    ROUND_2: 1,
    FINALS: 2,
    COMPLETE: 3
};

const colors = ['#1abc9c', '#2ecc71', '#3498db', '#8c52ff', '#9b59b6'];

// Ball object
const Ball = {
    new: function(speed) {
        return {
            width: 18,
            height: 18,
            x: this.canvas.width / 2 - 9,
            y: this.canvas.height / 2 - 9,
            moveX: DIRECTION.IDLE,
            moveY: DIRECTION.IDLE,
            speed: speed || INITIAL_BALL_SPEED,
            baseSpeed: INITIAL_BALL_SPEED
        };
    }
};

// Paddle object
const Paddle = {
    new: function(position, playerNumber) {
        let config = {
            left: { width: 18, height: 180, x: 150, y: this.canvas.height / 2 - 90 },
            right: { width: 18, height: 180, x: this.canvas.width - 150, y: this.canvas.height / 2 - 90 },
            bottom: { width: 180, height: 18, x: this.canvas.width / 2 - 90, y: this.canvas.height - 150 }
        };
        
        return {
            ...config[position],
            position: position,
            playerNumber: playerNumber,
            score: 0,
            move: DIRECTION.IDLE,
            speed: 8,
            active: true
        };
    }
};

// Button class
const Button = {
    new: function(text, y, callback) {
        return {
            text: text,
            y: y,
            width: 300,
            height: 60,
            x: this.canvas.width / 2 - 150,
            callback: callback,
            hovered: false
        };
    },
    draw: function(button) {
        this.context.fillStyle = button.hovered ? '#3498db' : '#2980b9';
        this.context.fillRect(button.x, button.y, button.width, button.height);
        
        this.context.fillStyle = '#ffffff';
        this.context.font = '24px Courier New';
        this.context.textAlign = 'center';
        this.context.fillText(button.text, button.x + button.width / 2, button.y + button.height / 2 + 8);
    },
    isMouseOver: function(button, mouseX, mouseY) {
        return mouseX >= button.x && mouseX <= button.x + button.width && 
               mouseY >= button.y && mouseY <= button.y + button.height;
    }
};

// Main Game Object
const Game = {
    initialize: function() {
        this.canvas = document.querySelector('canvas');
        this.context = this.canvas.getContext('2d');
        
        // Set canvas dimensions
        this.canvas.width = 1400;
        this.canvas.height = 1000;
        this.canvas.style.width = this.canvas.width / 2 + 'px';
        this.canvas.style.height = this.canvas.height / 2 + 'px';
        
        // Initialize game state
        this.state = GAME_STATES.MENU;
        this.mode = null;
        this.running = false;
        this.over = false;
        this.color = this._generateRoundColor();
        
        // Create menu buttons
        this.buttons = [
            Button.new.call(this, 'Single Player', this.canvas.height / 2 - 120, () => this.startGame(GAME_MODES.SINGLE_PLAYER)),
            Button.new.call(this, 'Two Players', this.canvas.height / 2 - 40, () => this.startGame(GAME_MODES.TWO_PLAYER)),
            Button.new.call(this, 'Multiplayer (3 Players)', this.canvas.height / 2 + 40, () => this.startGame(GAME_MODES.MULTIPLAYER)),
            Button.new.call(this, 'Tournament (4 Players)', this.canvas.height / 2 + 120, () => this.startTournament())
        ];
        
        this.setupEventListeners();
        this.loop();
    },

    // Initialization methods
    startGame: function(mode) {
        this.mode = mode;
        this.state = GAME_STATES.PLAYING;
        this.running = true;
        this.over = false;
        
        // Initialize players
        this.player1 = Paddle.new.call(this, 'left', 1);
        this.player2 = Paddle.new.call(this, 'right', 2);
        
        if (mode === GAME_MODES.MULTIPLAYER) {
            this.player3 = Paddle.new.call(this, 'bottom', 3);
        } else {
            this.player3 = null;
        }
        
        this.player4 = null; // Only used in tournament mode
        
        // Initialize ball
        this.ball = Ball.new.call(this);
        this.turn = this._getRandomPlayer();
        this.timer = Date.now();
        this.color = this._generateRoundColor();
    },

    startTournament: function() {
        this.mode = GAME_MODES.TOURNAMENT;
        this.state = GAME_STATES.PLAYING;
        this.running = true;
        this.over = false;
        
        // Create all tournament players
        this.player1 = Paddle.new.call(this, 'left', 1);
        this.player2 = Paddle.new.call(this, 'left', 2); // Will be activated in round 2
        this.player3 = Paddle.new.call(this, 'right', 3);
        this.player4 = Paddle.new.call(this, 'right', 4); // Will be activated in round 2
        
        // Deactivate players not in current round
        this.player2.active = false;
        this.player4.active = false;
        
        // Initialize tournament state
        this.tournament = {
            currentRound: TOURNAMENT_ROUNDS.ROUND_1,
            winners: [],
            roundText: "Round 1: Player 1 (Left) vs Player 3 (Right)"
        };
        
        this.ball = Ball.new.call(this);
        this.turn = Math.random() < 0.5 ? this.player1 : this.player3;
        this.timer = Date.now();
        this.color = this._generateRoundColor();
    },

    // Core game loop
    update: function() {
        if (!this.running || this.over) return;
        
        if (this.mode === GAME_MODES.TOURNAMENT) {
            this.updateTournament();
        }
        
        this.updateBall();
        this.updatePaddles();
        this.checkWinConditions();
    },

    updateTournament: function() {
        const leftPlayer = this.tournament.currentRound === TOURNAMENT_ROUNDS.ROUND_1 ? this.player1 : this.player2;
        const rightPlayer = this.tournament.currentRound === TOURNAMENT_ROUNDS.ROUND_1 ? this.player3 : this.player4;
        
        if (leftPlayer.score >= WINNING_SCORE) {
            this.handleTournamentWin(leftPlayer);
        } else if (rightPlayer.score >= WINNING_SCORE) {
            this.handleTournamentWin(rightPlayer);
        }
    },

    handleTournamentWin: function(winner) {
        this.tournament.winners.push(winner.playerNumber);
        
        if (this.tournament.currentRound === TOURNAMENT_ROUNDS.FINALS) {
            this.gameOver(`Player ${winner.playerNumber} Wins Tournament!`);
            return;
        }
        
        this.state = GAME_STATES.TOURNAMENT_ROUND_END;
        this.showingRoundResult = true;
        this.roundWinner = winner.playerNumber;
        this.roundEndTime = Date.now();
        
        setTimeout(() => this.advanceTournament(), 2000);
    },

    advanceTournament: function() {
        this.tournament.currentRound++;
        
        // Reset scores
        this.player1.score = 0;
        this.player2.score = 0;
        this.player3.score = 0;
        this.player4.score = 0;
        
        if (this.tournament.currentRound === TOURNAMENT_ROUNDS.ROUND_2) {
            this.tournament.roundText = "Round 2: Player 2 (Left) vs Player 4 (Right)";
            this.player1.active = false;
            this.player3.active = false;
            this.player2.active = true;
            this.player4.active = true;
            this.turn = Math.random() < 0.5 ? this.player2 : this.player4;
        } 
        else if (this.tournament.currentRound === TOURNAMENT_ROUNDS.FINALS) {
            const [winner1, winner2] = this.tournament.winners;
            this.tournament.roundText = `Finals: Player ${winner1} vs Player ${winner2}`;
            
            // Activate finalists
            this.player1.active = (winner1 === 1 || winner2 === 1);
            this.player2.active = (winner1 === 2 || winner2 === 2);
            this.player3.active = (winner1 === 3 || winner2 === 3);
            this.player4.active = (winner1 === 4 || winner2 === 4);
            
            // Set turn to random finalist
            const finalists = [winner1, winner2].map(n => 
                n <= 2 ? this['player' + n] : this['player' + (n - 2)]);
            this.turn = finalists[Math.floor(Math.random() * finalists.length)];
        }
        
        this.state = GAME_STATES.PLAYING;
        this.showingRoundResult = false;
        this.ball = Ball.new.call(this);
        this.timer = Date.now();
    },

    // [Rest of the methods (draw, input handling, etc.) would follow...]
};

// Initialize the game
const Pong = Object.assign({}, Game);
Pong.initialize();