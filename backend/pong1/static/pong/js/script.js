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
    TWO_PLAYER: 1
};

let rounds = [5, 5, 3, 3, 2];
let colors = ['#1abc9c', '#2ecc71', '#3498db', '#8c52ff', '#9b59b6'];

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
    new: function(side) {
        return {
            width: 18,
            height: 180,
            x: side === 'left' ? 150 : this.canvas.width - 150,
            y: (this.canvas.height / 2) - 90,
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

        this.player = Paddle.new.call(this, 'left');
        this.player2 = Paddle.new.call(this, 'right');
        this.ball = Ball.new.call(this);

        this.player2.speed = 5;
        this.running = false;
        this.over = false;
        this.turn = this.player2;
        this.timer = this.round = 0;
        this.color = '#8c52ff';

        this.state = GAME_STATES.MENU;
        this.mode = GAME_MODES.SINGLE_PLAYER;

        // Create menu buttons
        this.buttons = [
            Button.new.call(this, 'Single Player', (this.canvas.height / 2) - 70, function() {
                Pong.mode = GAME_MODES.SINGLE_PLAYER;
                Pong.startGame();
            }),
            Button.new.call(this, 'Two Players', (this.canvas.height / 2) + 10, function() {
                Pong.mode = GAME_MODES.TWO_PLAYER;
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
        this.player.score = 0;
        this.player2.score = 0;
        this.round = 0;
        this.ball = Ball.new.call(this);
        this.turn = this.player2;
        this.timer = (new Date()).getTime();
    },

    // Handle end game menu
    endGameMenu: function(text) {
        // Change the canvas font size and color
        this.context.font = '45px Courier New';
        this.context.fillStyle = this.color;

        // Draw the rectangle behind the text
        this.context.fillRect(
            this.canvas.width / 2 - 350,
            this.canvas.height / 2 - 48,
            700,
            100
        );

        // Change the canvas color
        this.context.fillStyle = '#ffffff';

        // Draw the end game menu text
        this.context.textAlign = 'center';
        this.context.fillText(text,
            this.canvas.width / 2,
            this.canvas.height / 2 + 15
        );

        setTimeout(function() {
            Pong = Object.assign({}, Game);
            Pong.initialize();
        }, 3000);
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
            // If the ball collides with the bound limits - correct the x and y coords.
            if (this.ball.x <= 0) this._resetTurn.call(this, this.player2, this.player);
            if (this.ball.x >= this.canvas.width - this.ball.width) this._resetTurn.call(this, this.player, this.player2);
            if (this.ball.y <= 0) this.ball.moveY = DIRECTION.DOWN;
            if (this.ball.y >= this.canvas.height - this.ball.height) this.ball.moveY = DIRECTION.UP;

            // Move player if they player.move value was updated by a keyboard event
            if (this.player.move === DIRECTION.UP) this.player.y -= this.player.speed;
            else if (this.player.move === DIRECTION.DOWN) this.player.y += this.player.speed;

            // Move player 2 based on game mode
            if (this.mode === GAME_MODES.TWO_PLAYER) {
                // In 2-player mode, move based on keyboard input
                if (this.player2.move === DIRECTION.UP) this.player2.y -= this.player2.speed;
                else if (this.player2.move === DIRECTION.DOWN) this.player2.y += this.player2.speed;
            } else {
                // In single player mode, AI controls player 2
                // Basic AI movement - follow the ball
                if (this.player2.y > this.ball.y - (this.player2.height / 2)) {
                    if (this.ball.moveX === DIRECTION.RIGHT) this.player2.y -= this.player2.speed / 1.5;
                    else this.player2.y -= this.player2.speed / 4;
                }
                if (this.player2.y < this.ball.y - (this.player2.height / 2)) {
                    if (this.ball.moveX === DIRECTION.RIGHT) this.player2.y += this.player2.speed / 1.5;
                    else this.player2.y += this.player2.speed / 4;
                }
            }

            // On new serve (start of each turn) move the ball to the correct side
            // and randomize the direction to add some challenge.
            if (this._turnDelayIsOver.call(this) && this.turn) {
                this.ball.moveX = this.turn === this.player ? DIRECTION.LEFT : DIRECTION.RIGHT;
                this.ball.moveY = [DIRECTION.UP, DIRECTION.DOWN][Math.round(Math.random())];
                this.ball.y = Math.floor(Math.random() * (this.canvas.height - 200)) + 100;
                this.turn = null;
            }

            // If the player collides with the bound limits, update the y coords.
            if (this.player.y <= 0) this.player.y = 0;
            else if (this.player.y >= (this.canvas.height - this.player.height)) this.player.y = (this.canvas.height - this.player.height);

            // If player 2 collides with the bound limits, update the y coords.
            if (this.player2.y <= 0) this.player2.y = 0;
            else if (this.player2.y >= (this.canvas.height - this.player2.height)) this.player2.y = (this.canvas.height - this.player2.height);

            // Move ball in intended direction based on moveY and moveX values
            if (this.ball.moveY === DIRECTION.UP) this.ball.y -= (this.ball.speed / 1.5);
            else if (this.ball.moveY === DIRECTION.DOWN) this.ball.y += (this.ball.speed / 1.5);
            if (this.ball.moveX === DIRECTION.LEFT) this.ball.x -= this.ball.speed;
            else if (this.ball.moveX === DIRECTION.RIGHT) this.ball.x += this.ball.speed;

            // Handle Player-Ball collisions
            if (this.ball.x - this.ball.width <= this.player.x && this.ball.x >= this.player.x - this.player.width) {
                if (this.ball.y <= this.player.y + this.player.height && this.ball.y + this.ball.height >= this.player.y) {
                    this.ball.x = (this.player.x + this.ball.width);
                    this.ball.moveX = DIRECTION.RIGHT;
                }
            }

            // Handle player2-ball collision
            if (this.ball.x - this.ball.width <= this.player2.x && this.ball.x >= this.player2.x - this.player2.width) {
                if (this.ball.y <= this.player2.y + this.player2.height && this.ball.y + this.ball.height >= this.player2.y) {
                    this.ball.x = (this.player2.x - this.ball.width);
                    this.ball.moveX = DIRECTION.LEFT;
                }
            }
        }

        // Handle the end of round transition
        // Check to see if the player won the round.
        if (this.player.score === rounds[this.round]) {
            // Check to see if there are any more rounds/levels left and display the victory screen if
            // there are not.
            if (!rounds[this.round + 1]) {
                this.over = true;
                setTimeout(function() { Pong.endGameMenu('Player 1 Wins!'); }, 1000);
            } else {
                // If there is another round, reset all the values and increment the round number.
                this.color = this._generateRoundColor();
                this.player.score = this.player2.score = 0;
                this.player.speed += 0.5;
                this.player2.speed += 1;
                this.ball.speed += 1;
                this.round += 1;
            }
        }
        // Check to see if the player2 has won the round.
        else if (this.player2.score === rounds[this.round]) {
            if (!rounds[this.round + 1]) {
                this.over = true;
                setTimeout(function() { 
                    Pong.endGameMenu(Pong.mode === GAME_MODES.SINGLE_PLAYER ? 'Game Over!' : 'Player 2 Wins!'); 
                }, 1000);
            } else {
                this.color = this._generateRoundColor();
                this.player.score = this.player2.score = 0;
                this.player.speed += 0.5;
                this.player2.speed += 1;
                this.ball.speed += 1;
                this.round += 1;
            }
        }
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

        // Draw the Player
        this.context.fillRect(
            this.player.x,
            this.player.y,
            this.player.width,
            this.player.height
        );

        // Draw the Player2/AI
        this.context.fillRect(
            this.player2.x,
            this.player2.y,
            this.player2.width,
            this.player2.height
        );

        // Draw the Ball
        if (this._turnDelayIsOver.call(this)) {
            this.context.fillRect(
                this.ball.x,
                this.ball.y,
                this.ball.width,
                this.ball.height
            );
        }

        // Draw the net (Line in the middle)
        this.context.beginPath();
        this.context.setLineDash([7, 15]);
        this.context.moveTo((this.canvas.width / 2), this.canvas.height - 140);
        this.context.lineTo((this.canvas.width / 2), 140);
        this.context.lineWidth = 10;
        this.context.strokeStyle = '#ffffff';
        this.context.stroke();

        // Set the default canvas font and align it to the center
        this.context.font = '100px Courier New';
        this.context.textAlign = 'center';

        // Draw the players score (left)
        this.context.fillText(
            this.player.score.toString(),
            (this.canvas.width / 2) - 300,
            200
        );

        // Draw the player2 score (right)
        this.context.fillText(
            this.player2.score.toString(),
            (this.canvas.width / 2) + 300,
            200
        );

        // Change the font size for the center score text
        this.context.font = '30px Courier New';

        // Draw the round info
        this.context.fillText(
            'Round ' + (this.round + 1),
            (this.canvas.width / 2),
            35
        );

        // Change the font size for the center score value
        this.context.font = '40px Courier';

        // Draw the current round goal
        this.context.fillText(
            rounds[this.round] ? rounds[this.round] : rounds[this.round - 1],
            (this.canvas.width / 2),
            100
        );

        // Display game mode
        this.context.font = '24px Courier New';
        this.context.fillText(
            this.mode === GAME_MODES.SINGLE_PLAYER ? 'Single Player Mode' : 'Two Player Mode',
            (this.canvas.width / 2),
            this.canvas.height - 70
        );
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
            if (key.key === 'w' || key.key === 'W') Pong.player.move = DIRECTION.UP;
            if (key.key === 's' || key.key === 'S') Pong.player.move = DIRECTION.DOWN;

            // Player 2 Controls (Arrow Up, Arrow Down)
            if (key.key === 'ArrowUp' && Pong.mode === GAME_MODES.TWO_PLAYER) Pong.player2.move = DIRECTION.UP;
            if (key.key === 'ArrowDown' && Pong.mode === GAME_MODES.TWO_PLAYER) Pong.player2.move = DIRECTION.DOWN;

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
                 Pong.player.move !== DIRECTION.IDLE) {
                Pong.player.move = DIRECTION.IDLE;
            }

            // Player 2
            if ((key.key === 'ArrowUp' || key.key === 'ArrowDown') && 
                 Pong.player2.move !== DIRECTION.IDLE) {
                Pong.player2.move = DIRECTION.IDLE;
            }
        });
    },

    // Reset the ball location, the player turns and set a delay before the next round begins.
    _resetTurn: function(victor, loser) {
        this.ball = Ball.new.call(this, this.ball.speed);
        this.turn = loser;
        this.timer = (new Date()).getTime();

        victor.score++;
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