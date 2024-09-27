let config = {
  type: Phaser.AUTO,
  width: window.innerWidth, // Full browser window width
  height: window.innerHeight, // Full browser window height
  backgroundColor: "#000000", // Black background
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
};

let game = new Phaser.Game(config);

let snake;
let food;
let cursors;
let direction;
let nextDirection;
let snakeSpeed = 150; // Snake speed (in milliseconds per move)
let lastMoveTime = 0;
let gridSize = 20; // Grid size for snake movement
let growSnake = false;
let score = 0;
let fruitsEaten = 0; // Variable to track the number of fruits eaten
let highscore = localStorage.getItem("highscore") || 0; // Fetch highscore from localStorage
let scoreText;
let highscoreText; // Text to display the highscore
let gameOverText;
let restartText; // Text for the restart button
let startText; // Text for the start screen
let isGameOver = false;
let isGameStarted = false; // Track if the game has started
let isFirstStart = true; // Track if it's the first start of the game
let borderThickness = 20; // Border thickness
let playAreaPadding = 20; // Padding for the black play area
let hudHeight = 60; // Height for the HUD above the play area
let overlapActive = true; // Flag to ensure overlap detection is only active when needed
let enterKey; // For handling Enter key for restart after game over
let backgroundImage; // Variable to hold the background image for the start screen

function preload() {
  // Load the food image
  this.load.image("food", "https://labs.phaser.io/assets/sprites/apple.png");

  // Load the background image for the start screen
  this.load.image("background", "greensnake.webp"); // Add your image here
}

function create() {
  // Set up keyboard controls
  cursors = this.input.keyboard.createCursorKeys();
  enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER); // Set up Enter key

  // Add the background image (centered and covering the whole screen)
  backgroundImage = this.add.image(
    window.innerWidth / 2,
    window.innerHeight / 2,
    "background"
  );
  backgroundImage.setOrigin(0.5, 0.5); // Center the image
  backgroundImage.displayWidth = window.innerWidth; // Scale to full width
  backgroundImage.displayHeight = window.innerHeight; // Scale to full height

  // Draw the black play area with a black border (20px border + padding inside)
  let graphics = this.add.graphics();
  graphics.lineStyle(borderThickness, 0x000000); // Black border
  graphics.strokeRect(
    playAreaPadding,
    hudHeight + playAreaPadding, // Adjusted for HUD height
    window.innerWidth - playAreaPadding * 2,
    window.innerHeight - hudHeight - playAreaPadding * 2 // Adjusted for HUD height
  );

  // Create the start screen text (only shown at first start)
  startText = this.add.text(
    window.innerWidth / 2,
    window.innerHeight / 2,
    "Tryk Enter for at starte",
    {
      fontSize: "48px",
      fill: "#FFF",
    }
  );
  startText.setOrigin(0.5); // Center the text

  // Add event listener for the Enter key to start the game (first start only)
  this.input.keyboard.on("keydown-ENTER", startGame, this);

  // Reset variables when the game starts/restarts
  direction = "RIGHT";
  nextDirection = "RIGHT";
  isGameOver = false;
  score = 0;
  fruitsEaten = 0; // Reset fruits eaten
  overlapActive = true; // Ensure overlap detection is active initially

  // Create the snake as a group
  snake = this.add.group();

  // Start with 5 snake segments (green squares)
  for (let i = 0; i < 5; i++) {
    let segment = this.add
      .rectangle(
        400 - i * gridSize,
        300 + hudHeight,
        gridSize,
        gridSize,
        0x00ff00
      ) // Adjusted for HUD
      .setOrigin(0);
    this.physics.add.existing(segment); // Add physics to each segment
    snake.add(segment);
  }

  // Create the food object within the playable area
  food = this.physics.add
    .image(
      randomPosition(window.innerWidth),
      randomPosition(window.innerHeight - hudHeight), // Adjusted for HUD
      "food"
    )
    .setOrigin(0);

  // Hide snake and food initially (before game start)
  snake.setVisible(false);
  food.setVisible(false);

  // Create the score text above the play area (HUD section)
  scoreText = this.add.text(
    playAreaPadding + 10,
    playAreaPadding + 10,
    "Score: 0",
    { fontSize: "32px", fill: "#FFF" }
  );
  scoreText.setVisible(false); // Hide score initially

  // Create the highscore text in the top-right corner of the HUD
  highscoreText = this.add.text(
    window.innerWidth - playAreaPadding - 350, // Adjusted value to move it left
    playAreaPadding + 10,
    "Highscore: " + highscore,
    { fontSize: "32px", fill: "#FFF" }
  );
  highscoreText.setVisible(false); // Hide highscore initially

  // Create the Game Over text (initially hidden)
  gameOverText = this.add.text(
    window.innerWidth / 2,
    window.innerHeight / 2,
    "Game Over!",
    { fontSize: "64px", fill: "#FFF" }
  );
  gameOverText.setOrigin(0.5); // Center the text
  gameOverText.setVisible(false); // Hide it initially

  // Create the restart button text (initially hidden)
  restartText = this.add.text(
    window.innerWidth / 2,
    window.innerHeight / 2 + 100,
    "Prøv igen",
    { fontSize: "48px", fill: "#FFF" }
  );
  restartText.setOrigin(0.5);
  restartText.setVisible(false); // Hide it initially

  // Make the restart text interactive and add an event listener for restarting
  restartText.setInteractive({ useHandCursor: true });
  restartText.on("pointerdown", resetGame, this);

  // Add an event listener to resize the game when the window is resized
  window.addEventListener("resize", () => resizeGame(this), false);
}

function startGame() {
  if (isGameStarted) return; // Prevent starting again if already started

  isGameStarted = true; // Mark the game as started

  // Hide the start screen text and background (only do this once at the first start)
  if (isFirstStart) {
    startText.setVisible(false);
    backgroundImage.setVisible(false); // Hide the background image
    isFirstStart = false; // After the first start, this is false
  }

  // Show snake, food, score, and highscore
  snake.setVisible(true);
  food.setVisible(true);
  scoreText.setVisible(true);
  highscoreText.setVisible(true); // Show highscore when game starts
}

function resetGame() {
  // Reset the game state and start the game directly (without the start screen)
  isGameOver = false;
  isGameStarted = true;
  score = 0;
  fruitsEaten = 0; // Reset the fruit count
  snakeSpeed = 150; // Reset speed

  // Hide Game Over elements
  gameOverText.setVisible(false);
  restartText.setVisible(false);

  // Reset the snake and food positions
  snake.clear(true, true); // Clear the snake and recreate it
  for (let i = 0; i < 5; i++) {
    let segment = this.add
      .rectangle(
        400 - i * gridSize,
        300 + hudHeight,
        gridSize,
        gridSize,
        0x00ff00
      ) // Adjusted for HUD
      .setOrigin(0);
    this.physics.add.existing(segment);
    snake.add(segment);
  }

  food.setPosition(
    randomPosition(window.innerWidth),
    randomPosition(window.innerHeight - hudHeight) // Adjusted for HUD
  ); // Reset food position

  // Show snake, food, and score
  snake.setVisible(true);
  food.setVisible(true);
  scoreText.setVisible(true);
  highscoreText.setVisible(true); // Ensure highscore is visible

  // Reset the score text
  updateScore();

  // Remove the Enter key restart listener (so it doesn't stay active)
  enterKey.off("down");
}

function update(time) {
  if (isGameOver || !isGameStarted) {
    return; // Stop updates when the game is over or hasn't started
  }

  // Update the direction based on keyboard input
  if (cursors.left.isDown && direction !== "RIGHT") {
    nextDirection = "LEFT";
  } else if (cursors.right.isDown && direction !== "LEFT") {
    nextDirection = "RIGHT";
  } else if (cursors.up.isDown && direction !== "DOWN") {
    nextDirection = "UP";
  } else if (cursors.down.isDown && direction !== "UP") {
    nextDirection = "DOWN";
  }

  // Move the snake based on the speed
  if (time > lastMoveTime + snakeSpeed) {
    lastMoveTime = time;
    direction = nextDirection; // Update the actual direction

    let head = snake.getChildren()[0]; // Get the snake's head
    let newX = head.x;
    let newY = head.y;

    // Move the head in the correct direction
    if (direction === "LEFT") {
      newX -= gridSize;
    } else if (direction === "RIGHT") {
      newX += gridSize;
    } else if (direction === "UP") {
      newY -= gridSize;
    } else if (direction === "DOWN") {
      newY += gridSize;
    }

    // Check for collision with the border
    if (
      newX < playAreaPadding ||
      newY < hudHeight + playAreaPadding ||
      newX >= window.innerWidth - playAreaPadding - gridSize ||
      newY >= window.innerHeight - playAreaPadding - gridSize
    ) {
      endGame(); // End the game if the snake hits the border
    }

    // Move the snake's body segments
    for (let i = snake.getChildren().length - 1; i > 0; i--) {
      let segment = snake.getChildren()[i];
      let previousSegment = snake.getChildren()[i - 1];
      segment.x = previousSegment.x;
      segment.y = previousSegment.y;
    }

    // Move the snake's head to the new position
    head.x = newX;
    head.y = newY;

    // Check for self-collision
    for (let i = 1; i < snake.getChildren().length; i++) {
      let segment = snake.getChildren()[i];
      if (head.x === segment.x && head.y === segment.y) {
        endGame(); // End the game if the snake hits itself
      }
    }

    // Grow the snake if needed
    if (growSnake) {
      let tail = snake.getChildren()[snake.getChildren().length - 1];
      let newSegment = this.add
        .rectangle(tail.x, tail.y, gridSize, gridSize, 0x00ff00)
        .setOrigin(0);
      this.physics.add.existing(newSegment); // Add physics to the new segment
      snake.add(newSegment);
      growSnake = false;
    }

    // Re-enable overlap detection after moving the snake
    overlapActive = true;
  }

  // Update collision detection between the snake and food
  if (overlapActive) {
    this.physics.world.collide(
      snake.getChildren()[0],
      food,
      handleOverlap,
      null,
      this
    );
  }
}

function updateScore() {
  scoreText.setText("Score: " + score); // Update the score text

  // Check if current score beats the highscore
  if (score > highscore) {
    highscore = score; // Update highscore
    localStorage.setItem("highscore", highscore); // Store new highscore in localStorage
    highscoreText.setText("Highscore: " + highscore); // Update highscore text on screen
  }
}

// Function to end the game
function endGame() {
  isGameOver = true; // Mark the game as over
  gameOverText.setVisible(true); // Show the "Game Over" text
  restartText.setVisible(true); // Show the "Prøv igen" text button

  // Add Enter key listener for restarting the game
  enterKey.on("down", resetGame, this);
}

// Handle overlap between snake and food
function handleOverlap(head, food) {
  if (!overlapActive) return; // Only handle the first overlap
  overlapActive = false; // Disable further overlaps for this frame

  growSnake = true; // Prepare the snake to grow

  // Move the food to a new random position within the black area, avoiding the snake
  do {
    food.setPosition(
      randomPosition(window.innerWidth - playAreaPadding * 2), // Adjust for padding
      randomPosition(window.innerHeight - hudHeight - playAreaPadding * 2) // Adjust for padding and HUD
    );
  } while (isFoodOnSnake(food)); // Check if food is placed on the snake

  score += 1; // Increase the score by 1
  fruitsEaten += 1; // Track how many fruits have been eaten

  // Increase snake speed by 10 for every 10 fruits eaten
  if (fruitsEaten % 10 === 0) {
    snakeSpeed = Math.max(snakeSpeed - 10, 50); // Increase speed, but keep a minimum of 50
  }

  updateScore(); // Update the score on the screen
}

// Function to check if the food is placed on the snake
function isFoodOnSnake(food) {
  let foodX = food.x;
  let foodY = food.y;

  // Iterate over all snake segments to check if food overlaps with any segment
  for (let i = 0; i < snake.getChildren().length; i++) {
    let segment = snake.getChildren()[i];
    if (segment.x === foodX && segment.y === foodY) {
      return true; // Food is on the snake, return true
    }
  }

  return false; // No overlap, return false
}

// Function to find a random position within the playable area
function randomPosition(max) {
  let min = playAreaPadding; // Ensure food is placed within the padded area
  let maxPosition = max - playAreaPadding - gridSize;

  // Ensure that food doesn't overlap the border
  return (
    Math.floor((Math.random() * (maxPosition - min)) / gridSize) * gridSize +
    min
  );
}

// Function to resize the game when the window size changes
function resizeGame(scene) {
  let width = window.innerWidth;
  let height = window.innerHeight;
  scene.scale.resize(width, height);

  // Reposition the "Game Over" text and restart button in the middle
  gameOverText.setPosition(width / 2, height / 2);
  restartText.setPosition(width / 2, height / 2 + 100);
  highscoreText.setPosition(
    width - playAreaPadding - 350,
    playAreaPadding + 10
  ); // Recalculate highscore position on resize

  // Move the score text inside the padding area
  scoreText.setPosition(playAreaPadding + 10, playAreaPadding + 10);

  // Adjust start text position if needed
  startText.setPosition(width / 2, height / 2);

  // Adjust the background image size
  backgroundImage.displayWidth = width;
  backgroundImage.displayHeight = height;
}
