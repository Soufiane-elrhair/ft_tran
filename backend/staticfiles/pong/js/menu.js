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
    MULTIPLAYER: 2
};

let colors = ['#1abc9c', '#2ecc71', '#3498db', '#8c52ff', '#9b59b6'];
const WINNING_SCORE = 1;

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
            speed: incrementedSpeed || 7
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

        // Create menu buttons
        this.buttons = [
            Button.new.call(this, 'Single Player', (this.canvas.height / 2) - 120, function() {
                Pong.mode = GAME_MODES.SINGLE_PLAYER;
                Pong.startGame();
            }),
            Button.new.call(this, 'Two Players', (this.canvas.height / 2) - 40, function() {
                Pong.mode = GAME_MODES.TWO_PLAYER;
                Pong.startGame();
            }),
            Button.new.call(this, 'Multiplayer (3 Players)', (this.canvas.height / 2) + 40, function() {
                Pong.mode = GAME_MODES.MULTIPLAYER;
                Pong.startGame();
            })
        ];

        // Setup event listeners
        this.listen();

        // Start the game loop
        this.loop();
    },

    startGame: function() {
        this.state = GAME_STATES.PLAYING;
        this.running = true;
        this.player1.score = 0;
        this.player2.score = 0;
        this.player3.score = 0;
        this.ball = Ball.new.call(this);
        this.turn = this.player2;
        this.timer = (new Date()).getTime();
    },

    // Handle end game menu
    endGameMenu: function(text) {
        // Clear the canvas first to ensure message is visible
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fill the background
        this.context.fillStyle = this.color;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw a more prominent box for the message
        this.context.fillStyle = '#000000';
        this.context.fillRect(
            this.canvas.width / 2 - 350,
            this.canvas.height / 2 - 100,
            700,
            200
        );
        
        // Draw border for visibility
        this.context.strokeStyle = '#ffffff';
        this.context.lineWidth = 5;
        this.context.strokeRect(
            this.canvas.width / 2 - 350,
            this.canvas.height / 2 - 100,
            700,
            200
        );
        
        // Change the canvas color for text
        this.context.fillStyle = '#ffffff';
        
        // Draw the game over text
        this.context.font = '60px Courier New';
        this.context.textAlign = 'center';
        this.context.fillText("GAME OVER", 
            this.canvas.width / 2,
            this.canvas.height / 2 - 20
        );
        
        // Draw the winner text
        this.context.font = '45px Courier New';
        this.context.fillText(text,
            this.canvas.width / 2,
            this.canvas.height / 2 + 50
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

    // Update all objects
    update: function() {
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
        } else if (this.turn === this.player3) {
            // For player 3, direction depends on ball position
            this.ball.moveX = (this.ball.x < this.canvas.width / 2) ? DIRECTION.RIGHT : DIRECTION.LEFT;
        }
        
        // Randomize up/down direction
        this.ball.moveY = [DIRECTION.UP, DIRECTION.DOWN][Math.round(Math.random())];
        
        // Randomize ball position
        if (this.mode === GAME_MODES.MULTIPLAYER) {
            // In multiplayer, keep the ball away from the edges on serve
            this.ball.y = Math.floor(Math.random() * (this.canvas.height - 300)) + 150;
            this.ball.x = Math.floor(Math.random() * (this.canvas.width - 300)) + 150;
        } else {
            // In other modes, serve from center with random y
            this.ball.x = this.canvas.width / 2;
            this.ball.y = Math.floor(Math.random() * (this.canvas.height - 200)) + 100;
        }
        
        this.turn = null;
    },
    
    handleCollisions: function() {
        // Handle Player 1 (left) collision with ball
        if (this.ball.x - this.ball.width <= this.player1.x && this.ball.x >= this.player1.x - this.player1.width) {
            if (this.ball.y <= this.player1.y + this.player1.height && this.ball.y + this.ball.height >= this.player1.y) {
                this.ball.x = (this.player1.x + this.ball.width);
                this.ball.moveX = DIRECTION.RIGHT;
            }
        }

        // Handle Player 2 (right) collision with ball
        if (this.ball.x - this.ball.width <= this.player2.x && this.ball.x >= this.player2.x - this.player2.width) {
            if (this.ball.y <= this.player2.y + this.player2.height && this.ball.y + this.ball.height >= this.player2.y) {
                this.ball.x = (this.player2.x - this.ball.width);
                this.ball.moveX = DIRECTION.LEFT;
            }
        }
        
        // Handle Player 3 (bottom) collision with ball in multiplayer mode
        if (this.mode === GAME_MODES.MULTIPLAYER) {
            if (this.ball.y + this.ball.height >= this.player3.y && 
                this.ball.y <= this.player3.y + this.player3.height) {
                if (this.ball.x + this.ball.width >= this.player3.x && 
                    this.ball.x <= this.player3.x + this.player3.width) {
                    this.ball.y = this.player3.y - this.ball.height;
                    this.ball.moveY = DIRECTION.UP;
                }
            }
        }
    },
    
    checkWinCondition: function() {
        // Check if any player has reached the winning score
        if (this.player1.score >= WINNING_SCORE) {
            this.over = true;
            this.displayWinMessage('Left Player Wins!');
        } else if (this.player2.score >= WINNING_SCORE) {
            this.over = true;
            const message = this.mode === GAME_MODES.SINGLE_PLAYER ? 'Computer Wins!' : 'Right Player Wins!';
            this.displayWinMessage(message);
        } else if (this.mode === GAME_MODES.MULTIPLAYER && this.player3.score >= WINNING_SCORE) {
            this.over = true;
            this.displayWinMessage('Bottom Player Wins!');
        }
        // Add these checks for the case when two players win (only in multiplayer mode)
        if (this.mode === GAME_MODES.MULTIPLAYER) {
            if (this.player1.score >= WINNING_SCORE && this.player2.score >= WINNING_SCORE) {
                this.over = true;
                this.displayWinMessage('Left and Right Players Win!');
            } else if (this.player1.score >= WINNING_SCORE && this.player3.score >= WINNING_SCORE) {
                this.over = true;
                this.displayWinMessage('Left and Bottom Players Win!');
            } else if (this.player2.score >= WINNING_SCORE && this.player3.score >= WINNING_SCORE) {
                this.over = true;
                this.displayWinMessage('Right and Bottom Players Win!');
            }
        }
    },

    displayWinMessage: function(text) {
        // Set a flag to show we're displaying the win message
        this.showingWinMessage = true;
        // Stop ball movement
        this.ball.moveX = DIRECTION.IDLE;
        this.ball.moveY = DIRECTION.IDLE;
        
        // Set a longer timer to show the message clearly
        setTimeout(function() { 
            Pong.endGameMenu(text); 
            
            // Set a longer timer for the reset
            setTimeout(function() {
                Pong = Object.assign({}, Game);
                Pong.initialize();
            }, 5000);
        }, 1000);
    },

    // Draw the objects to the canvas element
    draw: function() {
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

        // Keep the loop going
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
        document.addEventListener('keydown', function(key) {
            // Player 1 Controls (W, S)
            if (key.key === 'w' || key.key === 'W') Pong.player1.move = DIRECTION.UP;
            if (key.key === 's' || key.key === 'S') Pong.player1.move = DIRECTION.DOWN;

            // Player 2 Controls (Arrow Up, Arrow Down)
            if ((key.key === 'ArrowUp') && 
                (Pong.mode === GAME_MODES.TWO_PLAYER || Pong.mode === GAME_MODES.MULTIPLAYER)) {
                Pong.player2.move = DIRECTION.UP;
            }
            if ((key.key === 'ArrowDown') && 
                (Pong.mode === GAME_MODES.TWO_PLAYER || Pong.mode === GAME_MODES.MULTIPLAYER)) {
                Pong.player2.move = DIRECTION.DOWN;
            }
            
            // Player 3 Controls (N, M) - horizontal movement for bottom paddle
            if (key.key === 'n' || key.key === 'N') {
                if (Pong.mode === GAME_MODES.MULTIPLAYER) Pong.player3.move = DIRECTION.LEFT;
            }
            if (key.key === 'm' || key.key === 'M') {
                if (Pong.mode === GAME_MODES.MULTIPLAYER) Pong.player3.move = DIRECTION.RIGHT;
            }

            // Pause game with Escape key
            if (key.key === 'Escape' && Pong.state === GAME_STATES.PLAYING) {
                Pong.state = GAME_STATES.MENU;
                Pong.running = false;
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
        this.ball = Ball.new.call(this, this.ball.speed);
        this.turn = this._getRandomPlayer();
        this.timer = (new Date()).getTime();
    },
    
    // Choose a random player to serve
    _getRandomPlayer: function() {
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