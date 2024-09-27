// Create the Phaser game config
import {moveRight, moveLeft, playerIdle} from "./animations/playerAnimations.js";

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1000 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

// Create a new Phaser game instance
const game = new Phaser.Game(config);

let player;
let ground;
let cursors;
let obstacles;
let collectableHearts;
let score = 0;
let lifes = 3;
let invincible = false;
let scoreText;
let hearts;
let playAgainButton; // Button to restart the game
let gameIsRunning = true;

function preload() {
  gameIsRunning = true;
  // Load assets
  this.load.image('heart', 'img/heart.png');
  this.load.image('ground', 'https://labs.phaser.io/assets/sprites/platform.png');
  this.load.image('obstacle', 'https://labs.phaser.io/assets/sprites/crate.png');
  // Load background image
  this.load.image('background', 'img/sky-bg.jpg');  // Example image URL, replace with your own

  // Load the sprite sheet for the player
  this.load.spritesheet('player', 'img/player/idle/0_Reaper_Man_Idle_000.png', {
    frameWidth: 900,  // Width of each frame in the spritesheet
    frameHeight: 900  // Height of each frame in the spritesheet
  });
  // Load the sprite sheet for the player
  this.load.image('player_idle_1', 'img/player/idle/0_Reaper_Man_Idle_000.png',);
  this.load.image('player_idle_2', 'img/player/idle/0_Reaper_Man_Idle_001.png',);
  this.load.image('player_idle_3', 'img/player/idle/0_Reaper_Man_Idle_002.png',);
  this.load.image('player_idle_4', 'img/player/idle/0_Reaper_Man_Idle_003.png',);
  this.load.image('player_idle_5', 'img/player/idle/0_Reaper_Man_Idle_004.png',);
  this.load.image('player_idle_6', 'img/player/idle/0_Reaper_Man_Idle_005.png',);
  this.load.image('player_idle_7', 'img/player/idle/0_Reaper_Man_Idle_006.png',);
  this.load.image('player_idle_8', 'img/player/idle/0_Reaper_Man_Idle_007.png',);
  this.load.image('player_idle_9', 'img/player/idle/0_Reaper_Man_Idle_008.png',);
  this.load.image('player_idle_10', 'img/player/idle/0_Reaper_Man_Idle_009.png',);
  this.load.image('player_idle_11', 'img/player/idle/0_Reaper_Man_Idle_010.png',);
  this.load.image('player_idle_12', 'img/player/idle/0_Reaper_Man_Idle_011.png',);
  this.load.image('player_idle_13', 'img/player/idle/0_Reaper_Man_Idle_012.png',);
  this.load.image('player_idle_14', 'img/player/idle/0_Reaper_Man_Idle_013.png',);
  this.load.image('player_idle_15', 'img/player/idle/0_Reaper_Man_Idle_014.png',);
  this.load.image('player_idle_16', 'img/player/idle/0_Reaper_Man_Idle_015.png',);
  this.load.image('player_idle_17', 'img/player/idle/0_Reaper_Man_Idle_016.png',);
  this.load.image('player_idle_18', 'img/player/idle/0_Reaper_Man_Idle_017.png',);

  this.load.image('player_run_right_1', 'img/player/running/right/0_Reaper_Man_Running_000.png',);
  this.load.image('player_run_right_2', 'img/player/running/right/0_Reaper_Man_Running_001.png',);
  this.load.image('player_run_right_3', 'img/player/running/right/0_Reaper_Man_Running_002.png',);
  this.load.image('player_run_right_4', 'img/player/running/right/0_Reaper_Man_Running_003.png',);
  this.load.image('player_run_right_5', 'img/player/running/right/0_Reaper_Man_Running_004.png',);
  this.load.image('player_run_right_6', 'img/player/running/right/0_Reaper_Man_Running_005.png',);
  this.load.image('player_run_right_7', 'img/player/running/right/0_Reaper_Man_Running_006.png',);
  this.load.image('player_run_right_8', 'img/player/running/right/0_Reaper_Man_Running_007.png',);
  this.load.image('player_run_right_9', 'img/player/running/right/0_Reaper_Man_Running_008.png',);
  this.load.image('player_run_right_10', 'img/player/running/right/0_Reaper_Man_Running_009.png',);
  this.load.image('player_run_right_11', 'img/player/running/right/0_Reaper_Man_Running_010.png',);
  this.load.image('player_run_right_12', 'img/player/running/right/0_Reaper_Man_Running_011.png',);

  this.load.image('player_run_left_1', 'img/player/running/left/0_Reaper_Man_Running_000.png',);
  this.load.image('player_run_left_2', 'img/player/running/left/0_Reaper_Man_Running_001.png',);
  this.load.image('player_run_left_3', 'img/player/running/left/0_Reaper_Man_Running_002.png',);
  this.load.image('player_run_left_4', 'img/player/running/left/0_Reaper_Man_Running_003.png',);
  this.load.image('player_run_left_5', 'img/player/running/left/0_Reaper_Man_Running_004.png',);
  this.load.image('player_run_left_6', 'img/player/running/left/0_Reaper_Man_Running_005.png',);
  this.load.image('player_run_left_7', 'img/player/running/left/0_Reaper_Man_Running_006.png',);
  this.load.image('player_run_left_8', 'img/player/running/left/0_Reaper_Man_Running_007.png',);
  this.load.image('player_run_left_9', 'img/player/running/left/0_Reaper_Man_Running_008.png',);
  this.load.image('player_run_left_10', 'img/player/running/left/0_Reaper_Man_Running_009.png',);
  this.load.image('player_run_left_11', 'img/player/running/left/0_Reaper_Man_Running_010.png',);
  this.load.image('player_run_left_12', 'img/player/running/left/0_Reaper_Man_Running_011.png',);

}

function create() {
  this.gameIsRunning = true;
  this.anims.create(moveRight);
  this.anims.create(moveLeft);
  this.anims.create(playerIdle);

  // Add background image
  this.add.image(400, 300, 'background').setScale(1);  // Adjust position and scale as needed

  // Create ground
  ground = this.physics.add.staticGroup();
  ground.create(400, 580, 'ground').setScale(2).refreshBody();

  lifes = 3;
  score = 0;  // Reset score
  // Create player (positioned in the middle of the screen horizontally)
  player = this.physics.add.sprite(300, 100, 'player').play('player_idle', true);
  player.displayWidth = 100;
  player.displayHeight = 100;
  player.setBounce(0.4);
  player.setCollideWorldBounds(true);
  player.body.setGravityY(600);
  player.body.setSize(400, 500);

  // Create obstacles group
  obstacles = this.physics.add.group({
    allowGravity: false,  // Disable gravity for obstacles
    immovable: true  // Make obstacles immovable so they don't react to collisions
  });

  collectableHearts = this.physics.add.group({
    allowGravity: false,  // Disable gravity for obstacles
    immovable: true  // Make obstacles immovable so they don't react to collisions
  });

  // Create the hearts (for displaying lives in the top-right corner)
  hearts = this.add.group({
    key: 'heart',
    repeat: lifes - 1,  // Repeat n-1 times since the first heart is manually created
    setXY: { x: 680, y: 80, stepX: 40 }  // Position and spacing between hearts
  });

  // Adjust the size of each heart
  hearts.getChildren().forEach(function (heart) {
    heart.displayWidth = 25;  // Set the width of the heart
    heart.displayHeight = 25;  // Set the height of the heart
  });

  // Spawn obstacles periodically
  spawnObstacleWithRandomDelay.call(this);  // Bind `this` to the function call
  spawnHeartsWithRandomDelay.call(this);  // Bind `this` to the function call
  // Add collision detection between player and ground
  this.physics.add.collider(player, ground);

  // Add collision detection between player and obstacles
  this.physics.add.collider(player, obstacles, hitObstacle, null, this);
  this.physics.add.collider(player, collectableHearts, hitHeart, null, this);

  // Ensure obstacles collide with the ground as well
  this.physics.add.collider(obstacles, ground);

  // Create score text
  // Create score text and align it to the top-right corner
  scoreText = this.add.text(780, 16, 'Score: 0', { fontSize: '32px', fill: '#ffffff' });
  scoreText.setOrigin(1, 0);  // Align the text to the right edge
  // Enable cursor input for player movement
  cursors = this.input.keyboard.createCursorKeys();

}

function update() {
  // Player movement on the X-axis
  if (cursors.left.isDown) {
    player.anims.play('move_left', true);
    player.setVelocityX(-160);
  } else if (cursors.right.isDown) {
    player.anims.play('move_right', true);
    player.setVelocityX(160);
  } else {
    player.setVelocityX(0);  // Stop moving when no arrow key is pressed
    player.anims.play('player_idle', true);
  }

  // Allow player to jump
  if (cursors.up.isDown && player.body.touching.down) {
    player.setVelocityY(-600);
  }

  // Update the score as the player survives longer
  if (gameIsRunning) {
    score += 1;
    scoreText.setText('Score: ' + score);
  }

  // Store obstacles that are off-screen for later removal
  let obstaclesToRemove = [];

  // Iterate through the obstacles and collect off-screen ones
  obstacles.children.iterate(function (obstacle) {
    if (obstacle.x <= -obstacle.width) {
      obstaclesToRemove.push(obstacle);
    }
  });

  // Safely remove the off-screen obstacles
  obstaclesToRemove.forEach(function (obstacle) {
    obstacle.destroy();
  });
}

function spawnHeartsWithRandomDelay() {
  // Spawn the obstacle
  spawnHearts.call(this);  // Ensure `this` is bound

  // Generate a random delay between 6 and 10 seconds (6000ms - 10000ms)
  const randomDelay = Phaser.Math.Between(6000, 10000);

  // Schedule the next obstacle spawn with the random delay
  this.time.addEvent({
    delay: randomDelay,
    callback: () => {
      spawnHeartsWithRandomDelay.call(this);  // Use arrow function to keep `this` in scope
    },
    callbackScope: this
  });
}

// Spawn obstacles in front of the player
function spawnHearts() {
  // Place the obstacle slightly above the ground (Y position = 520 is where the ground is)

  const collectableHeart = collectableHearts.create(800, 485, 'heart');

  // Set the velocity of the obstacle to move left (negative X-axis)
  collectableHeart.setVelocityX(-180);  // Move towards the player
  collectableHeart.setCollideWorldBounds(false);
  collectableHeart.displayWidth = 25;  // Set the width of the heart
  collectableHeart.displayHeight = 25;  // Set the height of the heart
}

// Spawn obstacles in front of the player
function spawnObstacle() {
  // Place the obstacle slightly above the ground (Y position = 520 is where the ground is)

  const obstacle = obstacles.create(800, 485, 'obstacle');

  // Set the velocity of the obstacle to move left (negative X-axis)
  obstacle.setVelocityX(-200);  // Move towards the player
  obstacle.setCollideWorldBounds(false);
}

function spawnObstacleWithRandomDelay() {
  // Spawn the obstacle
  spawnObstacle.call(this);  // Ensure `this` is bound

  // Generate a random delay between 1 and 3 seconds (1000ms - 3000ms)
  const randomDelay = Phaser.Math.Between(1000, 2500);

  // Schedule the next obstacle spawn with the random delay
  this.time.addEvent({
    delay: randomDelay,
    callback: () => {
      spawnObstacleWithRandomDelay.call(this);  // Use arrow function to keep `this` in scope
    },
    callbackScope: this
  });
}

function hitHeart(player, heart) {
  // Remove the heart from the scene
  heart.destroy();

  // Increase the player's lives
  if (lifes >= 3) {
    return;
  }
  lifes += 1;

  // Add a heart to the display when a life is gained
  hearts.create(680 + (40 * (lifes - 1)), 80, 'heart').setDisplaySize(25, 25);
  // Increase the player's score
  score += 100;
  scoreText.setText('Score: ' + score);
}

// When the player hits an obstacle, restart the game
function hitObstacle(player, obstacle) {
  // Check if the player is invincible, if so, ignore the collision
  if (invincible) {
    return;
  }

  lifes -= 1;  // Reduce lives

  // Remove a heart from the display when a life is lost
  hearts.getChildren()[lifes].destroy();

  if (lifes > 0) {
    // Make the player temporarily invincible
    invincible = true;

    // Disable player-obstacle collisions for a short period
    this.physics.world.disable(obstacle);  // Temporarily disable physics collision

    // Blinking effect using tween
    this.tweens.add({
      targets: player,
      alpha: 0,          // Make the player invisible
      duration: 100,     // Duration of each blink (in ms)
      ease: 'Linear',
      yoyo: true,        // Reverse the tween (blink effect)
      repeat: 5,         // Number of blinks
      onComplete: () => {
        // After blinking, re-enable player physics and collisions
        this.physics.world.enable(obstacle);
        invincible = false;
      }
    });

    // Allow player to pass through obstacle temporarily
    obstacle.body.checkCollision.none = true;

    // Re-enable collisions after a short delay (e.g., 1 second)
    this.time.delayedCall(1000, () => {
      obstacle.body.checkCollision.none = false;
    }, [], this);
  } else {
    // If lives are 0, restart the game
    this.physics.pause();
    player.setTint(0xff0000);  // Turn player red
    endGame.call(this);  // End the game
    //this.scene.restart();  // Restart the scene
  }
}

function endGame() {
  // Display game over text and reset the game
  this.add.text(400, 300, 'Game Over', { fontSize: '64px', fill: '#c51818' }).setOrigin(0.5);

  // Create a "Play Again" button
  playAgainButton = this.add.text(400, 550, 'Play Again', { fontSize: '32px', fill: '#00ff00' })
    .setOrigin(0.5)
    .setInteractive()
    .on('pointerdown', () => restartGame.call(this))  // Restart the game when clicked
    .on('pointerover', () => playAgainButton.setStyle({ fill: '#ff0' }))  // Hover effect
    .on('pointerout', () => playAgainButton.setStyle({ fill: '#00ff00' }));  // Reset hover effect

  // Stop the game physics (optional)
  this.physics.pause();
  gameIsRunning = false;
}

function restartGame() {
  // Clear the scores array and restart the scene
  this.scene.restart();  // Restart the current scene
}


