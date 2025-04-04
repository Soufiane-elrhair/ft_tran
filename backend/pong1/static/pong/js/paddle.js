const INITIAL_BALL_SPEED = 7;
const SPEED_INCREMENT = 0.2;  // How much speed increases per hit
const MAX_BALL_SPEED = 15;    // Maximum speed limit
const MAX_NAME_LENGTH = 8;

// Constants for direction
const DIRECTION = {
    IDLE: 0,
    UP: 1,
    DOWN: 2,
    LEFT: 3,
    RIGHT: 4
};

// Game configurations
const GAME_STATES = {
    MENU: 0,
    PLAYING: 1,
    GAME_OVER: 2
};

const GAME_MODES = {
    SINGLE_PLAYER: 0,
    TWO_PLAYER: 1,
    MULTIPLAYER: 2,
    TOURNAMENT: 3 
};

const TOURNAMENT_STATE = {
    ROUND_1: 0,
    ROUND_2: 1,
    ROUND_3: 2,
    COMPLETE: 3
};

let colors = ['#1abc9c', '#2ecc71', '#3498db', '#8c52ff', '#9b59b6'];
const WINNING_SCORE = 2;

// Ball object
const Ball = {
    new: function(incrementedSpeed) {
        return {
            width: 18,
            height: 18,
            x: (this.canvas.width / 2) - 9,
            y: (this.canvas.height / 2) - 9,
            moveX: DIRECTION.IDLE,
            moveY: DIRECTION.IDLE,
            speed: incrementedSpeed || INITIAL_BALL_SPEED,  // Use the constant
            baseSpeed: INITIAL_BALL_SPEED  // Store the base speed
        };
    }
};

// Paddle object
const Paddle = {
    new: function(position) {
        let x, y, width, height;
        
        if (position === 'left') {
            width = 18;
            height = 180;
            x = 150;
            y = (this.canvas.height / 2) - 90;
        } else if (position === 'right') {
            width = 18;
            height = 180;
            x = this.canvas.width - 150;
            y = (this.canvas.height / 2) - 90;
        } else if (position === 'bottom') {
            width = 180;
            height = 18;
            x = (this.canvas.width / 2) - 90;
            y = this.canvas.height - 150;
        }
        
        return {
            width: width,
            height: height,
            x: x,
            y: y,
            position: position,
            score: 0,
            move: DIRECTION.IDLE,
            speed: 8
        };
    }
};

// Button class for menu
const Button = {
    new: function(text, y, callback) {
        return {
            text: text,
            y: y,
            width: 300,
            height: 60,
            x: (this.canvas.width / 2) - 150,
            callback: callback,
            hovered: false
        };
    },
    draw: function(button) {
        // Draw button background
        this.context.fillStyle = button.hovered ? '#3498db' : '#2980b9';
        this.context.fillRect(button.x, button.y, button.width, button.height);
        
        // Draw button text
        this.context.fillStyle = '#ffffff';
        this.context.font = '24px Courier New';
        this.context.textAlign = 'center';
        this.context.fillText(button.text, button.x + (button.width / 2), button.y + (button.height / 2) + 8);
    },
    isMouseOver: function(button, mouseX, mouseY) {
        return mouseX >= button.x && 
               mouseX <= button.x + button.width && 
               mouseY >= button.y && 
               mouseY <= button.y + button.height;
    }
};

// Main game object
const Game = {
    initialize: function() {
        this.canvas = document.querySelector('canvas');
        this.context = this.canvas.getContext('2d');

        this.canvas.width = 1400;
        this.canvas.height = 1000;

        this.canvas.style.width = (this.canvas.width / 2) + 'px';
        this.canvas.style.height = (this.canvas.height / 2) + 'px';

        this.player1 = Paddle.new.call(this, 'left');
        this.player2 = Paddle.new.call(this, 'right');
        this.player3 = Paddle.new.call(this, 'bottom');
        this.ball = Ball.new.call(this);

        this.running = false;
        this.over = false;
        this.turn = this.player2;
        this.timer = 0;
        this.color = '#8c52ff';

        this.state = GAME_STATES.MENU;
        this.mode = GAME_MODES.SINGLE_PLAYER;

        this.playerNames = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
        this.getNameInput = false;
        this.currentPlayerNaming = 0;

        // Create menu buttons
        this.buttons = [
            Button.new.call(this, 'Single Player', (this.canvas.height / 2) - 120, function() {
                Pong.mode = GAME_MODES.SINGLE_PLAYER;
                Pong.playerNames = ['Player 1', 'Computer'];
                Pong.startGame();
            }),
            Button.new.call(this, 'Two Players', (this.canvas.height / 2) - 40, function() {
                Pong.mode = GAME_MODES.TWO_PLAYER;
                Pong.playerNames = ['Player 1', 'Player 2']; // Reset to defaults
                Pong.nameInputPlayerCount = 1; // Only get Player 2's name
                Pong.currentPlayerNaming = 1; // Start at Player 2 (index 1)
                Pong.tempName = '';
                Pong.getNameInput = true;
            }),
            Button.new.call(this, 'Multiplayer (3 Players)', (this.canvas.height / 2) + 40, function() {
                Pong.mode = GAME_MODES.MULTIPLAYER;
                Pong.playerNames = ['Player 1', 'Player 2', 'Player 3']; // Reset to defaults
                Pong.nameInputPlayerCount = 2; // Get names for Players 2 & 3
                Pong.currentPlayerNaming = 1; // Start at Player 2 (index 1)
                Pong.tempName = '';
                Pong.getNameInput = true;
            }),
            Button.new.call(this, 'Tournament Mode', (this.canvas.height / 2) + 120, function() {
                Pong.mode = GAME_MODES.TOURNAMENT;
                Pong.nameInputPlayerCount = 4;
                Pong.currentPlayerNaming = 0;
                Pong.tempName = '';
                Pong.getNameInput = true;
            })
        ];

        this.tournament = {
            currentRound: TOURNAMENT_STATE.ROUND_1,
            roundStartTime: 0,
            betweenRounds: false,
            roundWinner: null,
            scores: [0, 0] // Track wins for each player
        };

        // Setup event listeners
        this.listen();

        // Start the game loop
        this.loop();
    },



    startTournament: function() {
        // Change to initiate name input first
        this.getNameInput = true;
        this.currentPlayerNaming = 0;
        this.tempName = '';
        this.state = GAME_STATES.MENU; // Keep in menu until names are entered
    },

    initTournament: function() {
        this.tournament = {
            currentRound: TOURNAMENT_STATE.ROUND_1,
            roundStartTime: Date.now(),
            betweenRounds: false,
            roundWinners: [null, null], // Track winners of rounds 1 and 2
            currentPlayers: [this.playerNames[0], this.playerNames[1]] // First matchup
        };
        this.resetForTournamentRound();
        this.state = GAME_STATES.PLAYING;
        this.running = true;
    },

    showNameInputs: function() {
        this.getNameInput = true;
        this.currentPlayerNaming = 0;
        this.tempName = '';
        this.playerNames = ['', '', '', '']; // Reset names
        this.showNextNamePrompt();
    },

    startTournamentRounds: function() {
        this.tournament = {
            currentRound: TOURNAMENT_STATE.ROUND_1,
            roundStartTime: Date.now(),
            betweenRounds: false,
            roundWinners: [null, null],
            currentPlayers: [this.playerNames[0], this.playerNames[1]] // Use stored names
        };
        this.resetPaddles();
        this.player1.score = 0;
        this.player2.score = 0;
        this.state = GAME_STATES.PLAYING;
        this.running = true;
    },

    showNextNamePrompt: function() {
        if (this.currentPlayerNaming >= 4) {
            // All names collected, start tournament
            this.getNameInput = false;
            this.startTournamentRounds();
            return;
        }
        
        const defaultName = `Player ${this.currentPlayerNaming + 1}`;
        const input = prompt(
            `Enter name for Player ${this.currentPlayerNaming + 1} (max ${MAX_NAME_LENGTH} chars):`,
            defaultName
        );
        
        if (input === null) {
            // User cancelled, use default names
            for (let i = this.currentPlayerNaming; i < 4; i++) {
                this.playerNames[i] = `Player ${i + 1}`;
            }
            this.getNameInput = false;
            this.startTournamentRounds();
            return;
        }
        
        // Trim and limit name length
        const trimmedName = input.trim().slice(0, MAX_NAME_LENGTH);
        this.playerNames[this.currentPlayerNaming] = trimmedName || defaultName;
        this.currentPlayerNaming++;
        
        // Show next prompt or start tournament
        if (this.currentPlayerNaming < 4) {
            setTimeout(this.showNextNamePrompt.bind(this), 100);
        } else {
            this.getNameInput = false;
            this.startTournamentRounds();
        }
    },

    startGame: function() {
        this.state = GAME_STATES.PLAYING;
        this.running = true;
        this.over = false;
        
        // Reset scores
        this.player1.score = 0;
        this.player2.score = 0;
        if (this.mode === GAME_MODES.MULTIPLAYER) {
            this.player3.score = 0;
        }
        
        // Reset ball (with initial speed)
        this.ball = Ball.new.call(this, INITIAL_BALL_SPEED);
        this.turn = this._getRandomPlayer();
        this.timer = (new Date()).getTime();

        // Reset paddles
        this.player1.x = 150;
        this.player1.y = (this.canvas.height / 2) - (this.player1.height / 2);
        this.player2.x = this.canvas.width - 150;
        this.player2.y = (this.canvas.height / 2) - (this.player2.height / 2);
        if (this.mode === GAME_MODES.MULTIPLAYER) {
            this.player3.x = (this.canvas.width / 2) - (this.player3.width / 2);
            this.player3.y = this.canvas.height - 150;
        }
        
        // New background color
        this.color = this._generateRoundColor();
    },

    // Handle end game menu
    endGameMenu: function(text) {
        // Clear the canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fill the background
        this.context.fillStyle = '#000000';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw the game over box
        this.context.fillStyle = '#8c52ff';
        this.context.fillRect(
            this.canvas.width / 2 - 350,
            this.canvas.height / 2 - 150,
            700,
            300
        );
        
        // Draw border
        this.context.strokeStyle = '#ffffff';
        this.context.lineWidth = 5;
        this.context.strokeRect(
            this.canvas.width / 2 - 350,
            this.canvas.height / 2 - 150,
            700,
            300
        );
        
        // Draw the game over text
        this.context.fillStyle = '#ffffff';
        this.context.font = '60px Courier New';
        this.context.textAlign = 'center';
        this.context.fillText("GAME OVER", 
            this.canvas.width / 2,
            this.canvas.height / 2 - 50
        );
        
        // Draw the winner text
        this.context.font = '45px Courier New';
        this.context.fillText(text,
            this.canvas.width / 2,
            this.canvas.height / 2 + 30
        );
        
        // Draw instruction to return to menu
        this.context.font = '24px Courier New';
        this.context.fillText('Press ESC to return to menu',
            this.canvas.width / 2,
            this.canvas.height / 2 + 100
        );
    },

    // Draw the main menu
    drawMenu: function() {
        // Clear the Canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        this.context.fillStyle = this.color;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw game title
        this.context.font = '80px Courier New';
        this.context.fillStyle = '#ffffff';
        this.context.textAlign = 'center';
        this.context.fillText('PONG GAME', this.canvas.width / 2, this.canvas.height / 3);

        // Draw subtitle
        this.context.font = '24px Courier New';
        this.context.fillText('Select Game Mode', this.canvas.width / 2, (this.canvas.height / 3) + 60);

        // Draw buttons
        for (let i = 0; i < this.buttons.length; i++) {
            Button.draw.call(this, this.buttons[i]);
        }
    },

    startNextRound: function() {
        if (!this.tournament.betweenRounds) return;
        
        if (Date.now() - this.tournament.roundStartTime >= 3000) { // 3 second delay
            this.tournament.betweenRounds = false;
            this.tournament.currentRound++;
            
            // Set up next round matchups
            if (this.tournament.currentRound === TOURNAMENT_STATE.ROUND_2) {
                this.tournament.currentPlayers = [this.playerNames[2], this.playerNames[3]];
            } 
            else if (this.tournament.currentRound === TOURNAMENT_STATE.ROUND_3) {
                const round1Winner = this.tournament.roundWinners[0] === 1 ? 
                    this.playerNames[0] : this.playerNames[1];
                const round2Winner = this.tournament.roundWinners[1] === 2 ? 
                    this.playerNames[3] : this.playerNames[2];
                this.tournament.currentPlayers = [round1Winner, round2Winner];
            }
            
            this.resetForTournamentRound();
        }
    },
    
    resetForTournamentRound: function() {
        // Reset scores
        this.player1.score = 0;
        this.player2.score = 0;
        
        // Completely recreate the paddles
        this.player1 = Paddle.new.call(this, 'left');
        this.player2 = Paddle.new.call(this, 'right');
        
        // Reset ball with initial speed
        this.ball = Ball.new.call(this, INITIAL_BALL_SPEED);
        
        // Reset game state
        this.turn = this._getRandomPlayer();
        this.timer = Date.now();
        this.color = this._generateRoundColor();
        this.over = false;
        this.running = true;
    },
    // Update all objects
    update: function() {
        if (this.state !== GAME_STATES.PLAYING) return;
    
        // Only update if game is running and not over
        if (!this.running || this.over) return;
        if (this.getNameInput){ 
            this.drawNameInput();
            return;
        }
    
        // Handle between-rounds delay
        if (this.mode === GAME_MODES.TOURNAMENT && this.tournament.betweenRounds) {
            this.startNextRound();
            if (this.tournament.betweenRounds) return;
        }

        if (this.getNameInput || (this.mode === GAME_MODES.TOURNAMENT && this.tournament.betweenRounds)) {
            return;
        }

        if (this.state === GAME_STATES.MENU) return;

        if (this.mode === GAME_MODES.TOURNAMENT && this.tournament.betweenRounds) {
            // Handle time between rounds
            if (Date.now() - this.tournament.roundStartTime >= 3000) { // 3 second delay
                this.tournament.betweenRounds = false;
                this.startNextRound();
            }
            return;
        }

        if (this.state === GAME_STATES.MENU) {
            // Nothing to update in menu state
            return;
        }

        if (!this.over) {
            // Handle ball movement and collisions
            this.handleBallMovement();
            
            // Move players based on controls
            this.movePlayerPaddles();
            
            // On new serve (start of each turn) move the ball to the correct side
            // and randomize the direction to add some challenge.
            if (this._turnDelayIsOver.call(this) && this.turn) {
                this.serveBall();
            }
            
            // Handle paddle-ball collisions
            this.handleCollisions();
        }

        // Check if any player has reached the winning score
        this.checkWinCondition();
    },
    
    handleBallMovement: function() {
        // If the ball collides with the left or right bound limits
        if (this.ball.x <= 0) {
            if (this.mode === GAME_MODES.MULTIPLAYER) {
                this.player2.score++;
                this.player3.score++;
            } else {
                this.player2.score++;
            }
            this._resetBall();
        }
        
        if (this.ball.x >= this.canvas.width - this.ball.width) {
            if (this.mode === GAME_MODES.MULTIPLAYER) {
                this.player1.score++;
                this.player3.score++;
            } else {
                this.player1.score++;
            }
            this._resetBall();
        }
        
        // If the ball collides with the top bound
        if (this.ball.y <= 0) {
            this.ball.moveY = DIRECTION.DOWN;
        }
        
        // If the ball collides with the bottom bound
        if (this.ball.y >= this.canvas.height - this.ball.height) {
            if (this.mode === GAME_MODES.MULTIPLAYER) {
                // In three-player mode, if ball hits bottom wall, players 1 and 2 score
                // (unless the ball hits player 3's paddle)
                if (!(this.ball.x >= this.player3.x && 
                      this.ball.x <= this.player3.x + this.player3.width)) {
                    this.player1.score++;
                    this.player2.score++;
                    this._resetBall();
                    return;
                }
            }
            this.ball.moveY = DIRECTION.UP;
        }
        
        // Move ball in intended direction
        if (this.ball.moveY === DIRECTION.UP) this.ball.y -= (this.ball.speed / 1.5);
        else if (this.ball.moveY === DIRECTION.DOWN) this.ball.y += (this.ball.speed / 1.5);
        if (this.ball.moveX === DIRECTION.LEFT) this.ball.x -= this.ball.speed;
        else if (this.ball.moveX === DIRECTION.RIGHT) this.ball.x += this.ball.speed;
    },
    
    movePlayerPaddles: function() {
        // Move player 1 (left)
        if (this.player1.move === DIRECTION.UP) this.player1.y -= this.player1.speed;
        else if (this.player1.move === DIRECTION.DOWN) this.player1.y += this.player1.speed;
        
        // Contain player 1 within bounds
        if (this.player1.y <= 0) this.player1.y = 0;
        else if (this.player1.y >= (this.canvas.height - this.player1.height)) 
            this.player1.y = (this.canvas.height - this.player1.height);

        // Player 2 movement
        if (this.mode === GAME_MODES.SINGLE_PLAYER) {
            // AI controls player 2 in single player mode
            this.moveAI();
        } else {
            // Player controls in multi-player modes
            if (this.player2.move === DIRECTION.UP) this.player2.y -= this.player2.speed;
            else if (this.player2.move === DIRECTION.DOWN) this.player2.y += this.player2.speed;
            
            // Contain player 2 within bounds
            if (this.player2.y <= 0) this.player2.y = 0;
            else if (this.player2.y >= (this.canvas.height - this.player2.height)) 
                this.player2.y = (this.canvas.height - this.player2.height);
        }
        
        // Player 3 movement (in multiplayer mode)
        if (this.mode === GAME_MODES.MULTIPLAYER) {
            if (this.player3.move === DIRECTION.LEFT) this.player3.x -= this.player3.speed;
            else if (this.player3.move === DIRECTION.RIGHT) this.player3.x += this.player3.speed;
            
            // Contain player 3 within bounds
            if (this.player3.x <= 0) this.player3.x = 0;
            else if (this.player3.x >= (this.canvas.width - this.player3.width)) 
                this.player3.x = (this.canvas.width - this.player3.width);
        }
    },
    
    moveAI: function() {
        // Basic AI movement - follow the ball
        if (this.player2.y > this.ball.y - (this.player2.height / 2)) {
            if (this.ball.moveX === DIRECTION.RIGHT) this.player2.y -= this.player2.speed / 1.5;
            else this.player2.y -= this.player2.speed / 4;
        }
        if (this.player2.y < this.ball.y - (this.player2.height / 2)) {
            if (this.ball.moveX === DIRECTION.RIGHT) this.player2.y += this.player2.speed / 1.5;
            else this.player2.y += this.player2.speed / 4;
        }
        
        // Contain AI within bounds
        if (this.player2.y <= 0) this.player2.y = 0;
        else if (this.player2.y >= (this.canvas.height - this.player2.height)) 
            this.player2.y = (this.canvas.height - this.player2.height);
    },
    
    serveBall: function() {
        // Set initial ball direction based on who's turn it is
        if (this.turn === this.player1) {
            this.ball.moveX = DIRECTION.LEFT;
        } else if (this.turn === this.player2) {
            this.ball.moveX = DIRECTION.RIGHT;
        } else if (this.turn === this.player3 && this.mode === GAME_MODES.MULTIPLAYER) {
            // Only for 3-player mode
            this.ball.moveX = (this.ball.x < this.canvas.width / 2) ? DIRECTION.RIGHT : DIRECTION.LEFT;
        } else {
            // Default case (especially important for tournament mode)
            this.ball.moveX = [DIRECTION.LEFT, DIRECTION.RIGHT][Math.floor(Math.random() * 2)];
        }
        
        // Randomize up/down direction
        this.ball.moveY = [DIRECTION.UP, DIRECTION.DOWN][Math.round(Math.random())];
        
        // Position the ball appropriately
        if (this.mode === GAME_MODES.MULTIPLAYER) {
            this.ball.y = Math.floor(Math.random() * (this.canvas.height - 300)) + 150;
            this.ball.x = Math.floor(Math.random() * (this.canvas.width - 300)) + 150;
        } else {
            // For tournament and other modes
            this.ball.x = this.canvas.width / 2;
            this.ball.y = Math.floor(Math.random() * (this.canvas.height - 200)) + 100;
        }
        
        this.turn = null;
    },
    
    handleCollisions: function() {
        // Handle Player 1 collision
        if (this.ball.x - this.ball.width <= this.player1.x && this.ball.x >= this.player1.x - this.player1.width) {
            if (this.ball.y <= this.player1.y + this.player1.height && this.ball.y + this.ball.height >= this.player1.y) {
                this.ball.x = (this.player1.x + this.ball.width);
                this.ball.moveX = DIRECTION.RIGHT;
                this.increaseBallSpeed();
            }
        }
    
        // Handle Player 2 collision
        if (this.ball.x - this.ball.width <= this.player2.x && this.ball.x >= this.player2.x - this.player2.width) {
            if (this.ball.y <= this.player2.y + this.player2.height && this.ball.y + this.ball.height >= this.player2.y) {
                this.ball.x = (this.player2.x - this.ball.width);
                this.ball.moveX = DIRECTION.LEFT;
                this.increaseBallSpeed();
            }
        }
        
        // Handle Player 3 collision (multiplayer)
        if (this.mode === GAME_MODES.MULTIPLAYER) {
            if (this.ball.y + this.ball.height >= this.player3.y && 
                this.ball.y <= this.player3.y + this.player3.height) {
                if (this.ball.x + this.ball.width >= this.player3.x && 
                    this.ball.x <= this.player3.x + this.player3.width) {
                    this.ball.y = this.player3.y - this.ball.height;
                    this.ball.moveY = DIRECTION.UP;
                    this.increaseBallSpeed();
                }
            }
        }
    },
    
    // Add this new method to increase speed
    increaseBallSpeed: function() {
        this.ball.speed = Math.min(this.ball.speed + SPEED_INCREMENT, MAX_BALL_SPEED);
        const speedRatio = this.ball.speed / MAX_BALL_SPEED;
        this.ball.color = `hsl(${speedRatio * 120}, 100%, 50%)`;
    },
    
    getTournamentWinner: function() {
        const round1Winner = this.tournament.roundWinners[0] === 1 ? 
            this.playerNames[0] : this.playerNames[1];
        const round2Winner = this.tournament.roundWinners[1] === 2 ? 
            this.playerNames[3] : this.playerNames[2];
        const finalWinnerNum = this.tournament.roundWinners[2];
        
        return finalWinnerNum === 1 ? round1Winner : round2Winner;
    },

    prepareNextRound: function() {
        this.tournament.betweenRounds = true;
        this.tournament.roundStartTime = Date.now();
        this.tournament.currentRound++;
        
        // Reset game state for next round
        this.resetPaddles();
        this._resetBall();
        this.running = false;
        
        // Set up players for next round
        if (this.tournament.currentRound === TOURNAMENT_STATE.ROUND_2) {
            this.tournament.currentPlayers = [this.playerNames[2], this.playerNames[3]];
        } 
        else if (this.tournament.currentRound === TOURNAMENT_STATE.ROUND_3) {
            const round1Winner = this.tournament.roundWinners[0] === 1 ? 
                this.playerNames[0] : this.playerNames[1];
            const round2Winner = this.tournament.roundWinners[1] === 2 ? 
                this.playerNames[3] : this.playerNames[2];
            this.tournament.currentPlayers = [round1Winner, round2Winner];
        }
    },

    prepareNextRoundPlayers: function() {
        this.tournament.currentRound++;
        
        switch(this.tournament.currentRound) {
            case TOURNAMENT_STATE.ROUND_2:
                this.tournament.currentPlayers = [this.playerNames[2], this.playerNames[3]];
                break;
            case TOURNAMENT_STATE.ROUND_3:
                const round1Winner = this.tournament.roundWinners[0] === 1 ? 
                    this.playerNames[0] : this.playerNames[1];
                const round2Winner = this.tournament.roundWinners[1] === 2 ? 
                    this.playerNames[3] : this.playerNames[2];
                this.tournament.currentPlayers = [round1Winner, round2Winner];
                break;
        }
    },

    getTournamentChampion: function() {
        const round1Winner = this.tournament.roundWinners[0] === 1 
            ? this.playerNames[0] 
            : this.playerNames[1];
        const round2Winner = this.tournament.roundWinners[1] === 2 
            ? this.playerNames[3] 
            : this.playerNames[2];
        
        return this.tournament.roundWinners[2] === 1 ? round1Winner : round2Winner;
    },

    resetForNewRound: function() {
        this.player1.score = 0;
        this.player2.score = 0;
        this._resetBall();
        this.color = this._generateRoundColor();
        this.turn = this._getRandomPlayer();
        this.timer = (new Date()).getTime();
    },

    handleTournamentWin: function(winner) {
        const winnerNum = winner === this.player1 ? 1 : 2;
        this.tournament.roundWinners[this.tournament.currentRound] = winnerNum;
        
        // Store winner names immediately
        if (this.tournament.currentRound === TOURNAMENT_STATE.ROUND_1) {
            this.tournament.round1WinnerName = winner === this.player1 
                ? this.playerNames[0] 
                : this.playerNames[1];
        }
        else if (this.tournament.currentRound === TOURNAMENT_STATE.ROUND_2) {
            this.tournament.round2WinnerName = winner === this.player1 
                ? this.playerNames[2] 
                : this.playerNames[3];
        }
        
        if (this.tournament.currentRound === TOURNAMENT_STATE.ROUND_3) {
            const champion = this.getTournamentChampion();
            this.gameOver(`Tournament Champion: ${champion}`);
        } else {
            this.tournament.betweenRounds = true;
            this.tournament.roundStartTime = Date.now();
        }
    },

    checkWinCondition: function() {
        if (!this.running || this.over) return;
    
        // Handle non-tournament modes
        if (this.mode !== GAME_MODES.TOURNAMENT) {
            if (this.player1.score >= WINNING_SCORE) {
                this.gameOver(`${this.playerNames[0]} Wins!`);
                return;
            }
            
            if (this.player2.score >= WINNING_SCORE) {
                const winnerName = this.mode === GAME_MODES.SINGLE_PLAYER 
                    ? "Computer" 
                    : this.playerNames[1];
                this.gameOver(`${winnerName} Wins!`);
                return;
            }
            
            if (this.mode === GAME_MODES.MULTIPLAYER && this.player3.score >= WINNING_SCORE) {
                this.gameOver(`${this.playerNames[2]} Wins!`);
                return;
            }
        }
        if (this.mode === GAME_MODES.TOURNAMENT) {
            if (this.player1.score >= WINNING_SCORE) {
                this.handleTournamentWin(this.player1);
            } else if (this.player2.score >= WINNING_SCORE) {
                this.handleTournamentWin(this.player2);
            }
        }
        else {
            if (this.player1.score >= WINNING_SCORE) {
                this.gameOver(); // Let gameOver() handle the message
            } 
            else if (this.player2.score >= WINNING_SCORE) {
                this.gameOver();
            } 
            else if (this.mode === GAME_MODES.MULTIPLAYER && this.player3.score >= WINNING_SCORE) {
                this.gameOver();
            }
        }
    },

    gameOver: function(message) {
        this.over = true;
        this.running = false;
        this.state = GAME_STATES.GAME_OVER;
        this.winMessage = message;
        this.winMessageTime = Date.now();
        
        const finalMessage = message
        .replace('undefined', 'Player')
        .replace('undefined', 'Player');
    
        this.winMessage = finalMessage;

        // Create custom win message based on mode
        if (this.mode === GAME_MODES.SINGLE_PLAYER) {
            if (this.player1.score >= WINNING_SCORE) {
                this.winMessage = `${this.playerNames[0]} Wins!`;
            } else {
                this.winMessage = "Computer Wins!";
            }
        } 
        else if (this.mode === GAME_MODES.TWO_PLAYER) {
            const winner = this.player1.score >= WINNING_SCORE ? this.playerNames[0] : this.playerNames[1];
            this.winMessage = `${winner} Wins!`;
        }
        else if (this.mode === GAME_MODES.MULTIPLAYER) {
            // Handle all possible 3-player winning combinations
            if (this.player1.score >= WINNING_SCORE && this.player2.score >= WINNING_SCORE) {
                this.winMessage = `${this.playerNames[0]} & ${this.playerNames[1]} Win!`;
            }
            else if (this.player1.score >= WINNING_SCORE && this.player3.score >= WINNING_SCORE) {
                this.winMessage = `${this.playerNames[0]} & ${this.playerNames[2]} Win!`;
            }
            else if (this.player2.score >= WINNING_SCORE && this.player3.score >= WINNING_SCORE) {
                this.winMessage = `${this.playerNames[1]} & ${this.playerNames[2]} Win!`;
            }
            else if (this.player1.score >= WINNING_SCORE) {
                this.winMessage = `${this.playerNames[0]} Wins!`;
            }
            else if (this.player2.score >= WINNING_SCORE) {
                this.winMessage = `${this.playerNames[1]} Wins!`;
            }
            else {
                this.winMessage = `${this.playerNames[2]} Wins!`;
            }
        }
        
        this.winMessageTime = (new Date()).getTime();
        this.player1.move = DIRECTION.IDLE;
        this.player2.move = DIRECTION.IDLE;
        if (this.mode === GAME_MODES.MULTIPLAYER) {
            this.player3.move = DIRECTION.IDLE;
        }
        
        // Force immediate redraw
        this.draw();
    },

    displayWinMessage: function(text) {
        this.over = true;
        this.state = GAME_STATES.GAME_OVER;
        this.winMessage = text;
    },

    drawNameInput: function() {
        // Clear and draw background
        this.context.fillStyle = 'rgba(0,0,0,0.7)';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw prompt
        this.context.fillStyle = '#ffffff';
        this.context.font = '30px Courier New';
        this.context.textAlign = 'center';
        
        let promptText;
        if (this.mode === GAME_MODES.TWO_PLAYER) {
            promptText = "Enter name for Player 2:";
        } 
        else if (this.mode === GAME_MODES.MULTIPLAYER) {
            promptText = `Enter name for Player ${this.currentPlayerNaming + 1}:`;
        }
        else {
            promptText = `Enter name for Player ${this.currentPlayerNaming + 1}:`;
        }
        
        this.context.fillText(
            promptText,
            this.canvas.width/2,
            this.canvas.height/2 - 50
        );
        
        // Draw input box
        this.context.strokeStyle = '#ffffff';
        this.context.lineWidth = 2;
        this.context.strokeRect(
            this.canvas.width/2 - 150,
            this.canvas.height/2,
            300,
            50
        );
        
        // Draw current input text (centered in box)
        this.context.font = '24px Courier New';
        this.context.fillText(
            this.tempName || '',  // This shows what you're typing
            this.canvas.width/2,
            this.canvas.height/2 + 35
        );
        
        // Instructions
        this.context.font = '20px Courier New';
        this.context.fillText(
            'Press Enter when done',
            this.canvas.width/2,
            this.canvas.height/2 + 100
        );
    },

    // Draw the objects to the canvas element
    draw: function() {
        if (this.getNameInput) {
            this.drawNameInput();
            return;
        }
        // Handle different game states
        if (this.state === GAME_STATES.MENU) {
            this.drawMenu();
            return;
        }
        
        
        // Clear the Canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
        // Set the fill style to black
        this.context.fillStyle = this.color;
    
        // Draw the background
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
        // Draw speed indicator
        this.context.fillStyle = '#ffffff';
        this.context.font = '16px Courier New';
        this.context.fillText(
            `Speed: ${Math.round(this.ball.speed * 10)/10}`,
            50,
            50
        );
    
        if (this.mode === GAME_MODES.TOURNAMENT) {
            // Draw tournament info
            this.context.fillStyle = '#ffffff';
            this.context.font = '24px Courier New';
            this.context.textAlign = 'center';
            
            // Round information
            const roundText = [
                "Round 1 of 3",
                "Round 2 of 3", 
                "Final Round"
            ][this.tournament.currentRound];
            this.context.fillText(roundText, this.canvas.width/2, 40);
            
            // Player display using aliases
            let playerText;
            if (this.tournament.currentRound === TOURNAMENT_STATE.ROUND_3) {
                // For final round, show round 1 winner vs round 2 winner using stored names
                const leftPlayer = this.tournament.roundWinners[0] === 1 ? 
                    this.playerNames[0] : this.playerNames[1];
                const rightPlayer = this.tournament.roundWinners[1] === 2 ? 
                    this.playerNames[3] : this.playerNames[2];
                playerText = `${leftPlayer} vs ${rightPlayer}`;
            } else if (this.tournament.currentRound === TOURNAMENT_STATE.ROUND_2) {
                playerText = `${this.playerNames[2]} vs ${this.playerNames[3]}`;
            } else {
                playerText = `${this.playerNames[0]} vs ${this.playerNames[1]}`;
            }
            this.context.fillText(playerText, this.canvas.width/2, 80);
            
            // Between rounds message using aliases
            if (this.tournament.betweenRounds) {
                let winnerText;
                if (this.tournament.currentRound === TOURNAMENT_STATE.ROUND_1) {
                    const winnerName = this.tournament.roundWinners[0] === 1 
                        ? this.playerNames[0] 
                        : this.playerNames[1];
                    winnerText = `${winnerName} wins Round 1!`;
                } 
                else if (this.tournament.currentRound === TOURNAMENT_STATE.ROUND_2) {
                    const winnerName = this.tournament.roundWinners[1] === 2 
                        ? this.playerNames[3] 
                        : this.playerNames[2];
                    winnerText = `${winnerName} wins Round 2!`;
                }
                
                this.context.fillText(
                    winnerText,
                    this.canvas.width/2, 
                    this.canvas.height/2
                );
            }
        }

        if (this.mode !== GAME_MODES.TOURNAMENT) {
            // Display player names for non-tournament modes
            this.context.font = '24px Courier New';
            this.context.fillStyle = '#ffffff';
            this.context.textAlign = 'center';
            
            if (this.mode === GAME_MODES.MULTIPLAYER) {
                // Three-player mode layout (triangle formation)
                this.context.fillText(
                    this.playerNames[0], 
                    this.canvas.width / 4, 
                    40
                );
                this.context.fillText(
                    this.playerNames[1], 
                    (this.canvas.width / 4) * 3, 
                    40
                );
                this.context.fillText(
                    this.playerNames[2], 
                    this.canvas.width / 2, 
                    this.canvas.height - 80
                );
            } else {
                // Two-player/Single-player layout (left vs right)
                this.context.fillText(
                    this.playerNames[0], 
                    (this.canvas.width / 2) - 200, 
                    40
                );
                
                const p2Name = this.mode === GAME_MODES.SINGLE_PLAYER 
                    ? "Computer" 
                    : this.playerNames[1];
                    
                this.context.fillText(
                    p2Name, 
                    (this.canvas.width / 2) + 200, 
                    40
                );
            }
        }
        
    
        // If game is over, show the end game screen
        if (this.state === GAME_STATES.GAME_OVER) {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw the game over box
            this.context.fillStyle = '#8c52ff';
            this.context.fillRect(
                this.canvas.width / 2 - 350,
                this.canvas.height / 2 - 150,
                700,
                300
            );
            
            // Draw border
            this.context.strokeStyle = '#ffffff';
            this.context.lineWidth = 5;
            this.context.strokeRect(
                this.canvas.width / 2 - 350,
                this.canvas.height / 2 - 150,
                700,
                300
            );
            
            // Draw the game over text
            this.context.fillStyle = '#ffffff';
            this.context.font = '60px Courier New';
            this.context.textAlign = 'center';
            this.context.fillText(
                "GAME OVER", 
                this.canvas.width / 2,
                this.canvas.height / 2 - 80
            );
            
            // Draw the winner text (using the custom message)
            this.context.font = '45px Courier New';
            this.context.fillText(
                this.winMessage,
                this.canvas.width / 2,
                this.canvas.height / 2 + 20
            );
            
            // Draw instruction to return to menu
            this.context.font = '24px Courier New';
            this.context.fillText(
                'Press ESC to return to menu',
                this.canvas.width / 2,
                this.canvas.height / 2 + 100
            );
            return;
        }

        // Set the fill style to white (For the paddles and the ball)
        this.context.fillStyle = '#ffffff';

        // Draw Player 1 (left)
        this.context.fillRect(
            this.player1.x,
            this.player1.y,
            this.player1.width,
            this.player1.height
        );

        // Draw Player 2 (right)
        this.context.fillRect(
            this.player2.x,
            this.player2.y,
            this.player2.width,
            this.player2.height
        );
        
        // Draw Player 3 (bottom) in multiplayer mode
        if (this.mode === GAME_MODES.MULTIPLAYER) {
            this.context.fillRect(
                this.player3.x,
                this.player3.y,
                this.player3.width,
                this.player3.height
            );
        }

        // Draw the Ball
        if (this._turnDelayIsOver.call(this)) {
            this.context.fillRect(
                this.ball.x,
                this.ball.y,
                this.ball.width,
                this.ball.height
            );
        }

        // Draw the net (Line in the middle) for 2-player modes
        if (this.mode !== GAME_MODES.MULTIPLAYER) {
            this.context.beginPath();
            this.context.setLineDash([7, 15]);
            this.context.moveTo((this.canvas.width / 2), this.canvas.height - 140);
            this.context.lineTo((this.canvas.width / 2), 140);
            this.context.lineWidth = 10;
            this.context.strokeStyle = '#ffffff';
            this.context.stroke();
        }

        // Set the font and alignment for score display
        this.context.font = '100px Courier New';
        this.context.textAlign = 'center';

        // Draw the scores based on game mode
        if (this.mode === GAME_MODES.MULTIPLAYER) {
            // For 3-player mode, show scores in triangle formation
            // Player 1 (left)
            this.context.fillText(
                this.player1.score.toString(),
                200,
                200
            );
            
            // Player 2 (right)
            this.context.fillText(
                this.player2.score.toString(),
                this.canvas.width - 200,
                200
            );
            
            // Player 3 (bottom)
            this.context.fillText(
                this.player3.score.toString(),
                (this.canvas.width / 2),
                this.canvas.height - 100
            );
        } else {
            // For 1 and 2 player modes, show scores on left and right
            this.context.fillText(
                this.player1.score.toString(),
                (this.canvas.width / 2) - 300,
                200
            );

            this.context.fillText(
                this.player2.score.toString(),
                (this.canvas.width / 2) + 300,
                200
            );
        }

        // Display game info
        this.context.font = '24px Courier New';
        this.context.fillText(
            'First to ' + WINNING_SCORE + ' wins!',
            (this.canvas.width / 2),
            60
        );

        // Display game mode
        let modeText = "";
        switch(this.mode) {
            case GAME_MODES.SINGLE_PLAYER:
                modeText = "Single Player Mode";
                break;
            case GAME_MODES.TWO_PLAYER:
                modeText = "Two Player Mode";
                break;
            case GAME_MODES.MULTIPLAYER:
                modeText = "Three Player Mode";
                break;
        }
        
        this.context.fillText(
            modeText,
            (this.canvas.width / 2),
            this.canvas.height - 30
        );
        
        // Show controls info
        this.context.font = '18px Courier New';
        if (this.mode === GAME_MODES.MULTIPLAYER) {
            this.context.fillText(
                "P1: W/S - P2: ↑/↓ - P3: N/M - ESC: Menu",
                (this.canvas.width / 2),
                this.canvas.height - 60
            );
        } else {
            this.context.fillText(
                this.mode === GAME_MODES.SINGLE_PLAYER 
                    ? "Controls: W/S - ESC: Menu" 
                    : "P1: W/S - P2: ↑/↓ - ESC: Menu",
                (this.canvas.width / 2),
                this.canvas.height - 60
            );
        }
    },

    // Game loop
    loop: function() {
        Pong.update();
        Pong.draw();
        if (Pong.mode === GAME_MODES.TOURNAMENT && Pong.tournament.betweenRounds) {
            Pong.startNextRound(); // Handle between-round transitions
        }
        requestAnimationFrame(Pong.loop);
    },
    
    // Listen for keyboard and mouse events
    listen: function() {
        // Track mouse position for button hover effects
        this.canvas.addEventListener('mousemove', function(e) {
            if (Pong.state === GAME_STATES.MENU) {
                const rect = Pong.canvas.getBoundingClientRect();
                const mouseX = (e.clientX - rect.left) * (Pong.canvas.width / parseInt(Pong.canvas.style.width));
                const mouseY = (e.clientY - rect.top) * (Pong.canvas.height / parseInt(Pong.canvas.style.height));
                
                for (let i = 0; i < Pong.buttons.length; i++) {
                    Pong.buttons[i].hovered = Button.isMouseOver(Pong.buttons[i], mouseX, mouseY);
                }
            }
        });

        // Handle menu button clicks
        this.canvas.addEventListener('click', function(e) {
            if (Pong.state === GAME_STATES.MENU) {
                const rect = Pong.canvas.getBoundingClientRect();
                const mouseX = (e.clientX - rect.left) * (Pong.canvas.width / parseInt(Pong.canvas.style.width));
                const mouseY = (e.clientY - rect.top) * (Pong.canvas.height / parseInt(Pong.canvas.style.height));
                
                for (let i = 0; i < Pong.buttons.length; i++) {
                    if (Button.isMouseOver(Pong.buttons[i], mouseX, mouseY)) {
                        Pong.buttons[i].callback();
                        break;
                    }
                }
            }
        });

        // Handle keyboard events for player controls
        document.addEventListener('keydown', function(e) {

            if (Pong.getNameInput) {
                if (e.key === 'Enter' && Pong.tempName) {
                    Pong.playerNames[Pong.currentPlayerNaming] = Pong.tempName;
                    Pong.currentPlayerNaming++;
                    Pong.tempName = '';

                    if (Pong.mode === GAME_MODES.TOURNAMENT) {
                        if (Pong.currentPlayerNaming >= 4) {  // Only collect 4 names for tournament
                            Pong.getNameInput = false;
                            Pong.initTournament();  // Initialize tournament after names are collected
                        }
                    }
                    
                    // Check if we've collected all required names
                    else if (Pong.currentPlayerNaming > Pong.nameInputPlayerCount + (Pong.mode === GAME_MODES.MULTIPLAYER ? 0 : 0)) {
                        Pong.getNameInput = false;
                        
                        // Fill default names where needed
                        if (Pong.mode === GAME_MODES.TWO_PLAYER) {
                            Pong.playerNames[0] = 'Player 1'; // Ensure Player 1 stays default
                        } 
                        else if (Pong.mode === GAME_MODES.MULTIPLAYER) {
                            Pong.playerNames[0] = 'Player 1'; // Ensure Player 1 stays default
                        }
                        
                        Pong.startGame();
                    }
                }
                else if (e.key === 'Backspace') {
                    Pong.tempName = Pong.tempName.slice(0, -1);
                }
                else if (e.key.length === 1 && e.key.match(/[a-zA-Z0-9 ]/) && Pong.tempName.length < MAX_NAME_LENGTH) {
                    Pong.tempName = (Pong.tempName || '') + e.key;
                }
                Pong.draw();
                return; // Skip other key processing during name input
            }

            // Player 1 Controls (W, S)
            if (e.key === 'w' || e.key === 'W') Pong.player1.move = DIRECTION.UP;
            if (e.key === 's' || e.key === 'S') Pong.player1.move = DIRECTION.DOWN;

            // Player 2 Controls (Arrow Up, Arrow Down)
            if ((e.key === 'ArrowUp') && 
                (Pong.mode === GAME_MODES.TWO_PLAYER || Pong.mode === GAME_MODES.MULTIPLAYER || Pong.mode === GAME_MODES.TOURNAMENT)) {
                Pong.player2.move = DIRECTION.UP;
            }
            if ((e.key === 'ArrowDown') && 
                (Pong.mode === GAME_MODES.TWO_PLAYER || Pong.mode === GAME_MODES.MULTIPLAYER || Pong.mode === GAME_MODES.TOURNAMENT)) {
                Pong.player2.move = DIRECTION.DOWN;
            }
            
            // Player 3 Controls (N, M) - horizontal movement for bottom paddle
            if (e.key === 'n' || e.key === 'N') {
                if (Pong.mode === GAME_MODES.MULTIPLAYER) Pong.player3.move = DIRECTION.LEFT;
            }
            if (e.key === 'm' || e.key === 'M') {
                if (Pong.mode === GAME_MODES.MULTIPLAYER) Pong.player3.move = DIRECTION.RIGHT;
            }

            // Pause game with Escape key
            if (e.key === 'Escape') {
                if (Pong.state === GAME_STATES.PLAYING) {
                    // Pause game
                    Pong.state = GAME_STATES.MENU;
                    Pong.running = false;
                } 
                else if (Pong.state === GAME_STATES.GAME_OVER) {
                    // Return to menu from game over
                    Pong.state = GAME_STATES.MENU;
                    Pong.over = false;
                }
            }
        });

        // Stop the player paddles from moving when no keys are being pressed
        document.addEventListener('keyup', function(key) {
            // Player 1
            if ((key.key === 'w' || key.key === 'W' || key.key === 's' || key.key === 'S') && 
                 Pong.player1.move !== DIRECTION.IDLE) {
                Pong.player1.move = DIRECTION.IDLE;
            }

            // Player 2
            if ((key.key === 'ArrowUp' || key.key === 'ArrowDown') && 
                 Pong.player2.move !== DIRECTION.IDLE) {
                Pong.player2.move = DIRECTION.IDLE;
            }
            
            // Player 3
            if ((key.key === 'n' || key.key === 'N' || key.key === 'm' || key.key === 'M') && 
                 Pong.player3.move !== DIRECTION.IDLE) {
                Pong.player3.move = DIRECTION.IDLE;
            }
        });
    },

    // Reset the ball after scoring
    _resetBall: function() {
        this.ball = Ball.new.call(this, INITIAL_BALL_SPEED);  // Reset to initial speed
        this.turn = this._getRandomPlayer();
        this.timer = (new Date()).getTime();
    },

    resetPaddles: function() {
        // Player 1 (left)
        this.player1 = Paddle.new.call(this, 'left');
        
        // Player 2 (right)
        this.player2 = Paddle.new.call(this, 'right');
        
        // Player 3 (bottom) - only for multiplayer
        if (this.mode === GAME_MODES.MULTIPLAYER) {
            this.player3 = Paddle.new.call(this, 'bottom');
        }
    },
    
    // resetPaddlePositions: function() {
    //     // Player 1 (left)
    //     this.player1.y = (this.canvas.height / 2) - (this.player1.height / 2);
        
    //     // Player 2 (right)
    //     this.player2.y = (this.canvas.height / 2) - (this.player2.height / 2);
        
    //     // Player 3 (bottom) - only in multiplayer
    //     if (this.mode === GAME_MODES.MULTIPLAYER) {
    //         this.player3.x = (this.canvas.width / 2) - (this.player3.width / 2);
    //     }
        
    //     // Reset paddle movements
    //     this.player1.move = DIRECTION.IDLE;
    //     this.player2.move = DIRECTION.IDLE;
    //     if (this.mode === GAME_MODES.MULTIPLAYER) {
    //         this.player3.move = DIRECTION.IDLE;
    //     }
    // },

    // Add this new reset function:
resetGame: function() {
    this.over = false;
    this.running = true;
    this.state = GAME_STATES.PLAYING;
    
    // Reset scores
    this.player1.score = 0;
    this.player2.score = 0;
    if (this.mode === GAME_MODES.MULTIPLAYER) {
        this.player3.score = 0;
    }
    
    // Reset ball and paddles
    this._resetBall();
    this.resetPaddles();
    
    // New random turn
    this.turn = this._getRandomPlayer();
    this.timer = Date.now();
},
    
    // Choose a random player to serve
    _getRandomPlayer: function() {
        if (this.mode === GAME_MODES.TOURNAMENT) {
            return this.turn === this.player1 ? this.player2 : this.player1;
        }

        if (this.mode === GAME_MODES.MULTIPLAYER) {
            // In 3-player mode, randomly select one of the three players
            const players = [this.player1, this.player2, this.player3];
            return players[Math.floor(Math.random() * players.length)];
        } else {
            // In 2-player modes, alternate between player1 and player2
            return this.turn === this.player1 ? this.player2 : this.player1;
        }
    },

    // Wait for a delay to have passed after each turn.
    _turnDelayIsOver: function() {
        return ((new Date()).getTime() - this.timer >= 1000);
    },

    // Select a random color as the background of each level/round.
    _generateRoundColor: function() {
        var newColor = colors[Math.floor(Math.random() * colors.length)];
        if (newColor === this.color) return this._generateRoundColor();
        return newColor;
    }
};

// Initialize the game
var Pong = Object.assign({}, Game);
Pong.initialize();