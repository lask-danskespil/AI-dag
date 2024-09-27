const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 }, // Adjust gravity to ensure tanks fall
      debug: true // Enable debugging for now to see collision shapes
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);

let players;
let currentTurn = 'player1';
let maxPower = 1000;
let minPower = 100;
let gravity = 300;
let wind = 0;
let power = minPower;
let isCharging = false;
let aimingLine;
let angle = 45; // Initial angle
let projectile;
let cursors;
let spaceBar;
let terrainHeight;
let terrainBodies;
let isBulletActive = false;
let arrow; // Declare the arrow sprite globally
let playerLives = { player1: 3, player2: 3 }; // Track lives for both players
let gameOver = false; // Track if the game is over


function preload() {
  this.load.image('tank1', 'assets/tank1.png'); // Replace with your actual tank asset
  this.load.image('tank2', 'assets/tank2.png'); // Replace with your actual tank asset
  this.load.image('ground', 'assets/ground.png'); // This can be a 1x1 pixel ground image (invisible ground collision body)
  this.load.image('bullet', 'assets/bullet.png'); // A small bullet sprite
}

function create() {
  generateWind(this);

  this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
  terrainBodies = this.physics.add.staticGroup(); // Create static group for terrain
  terrainHeight = generateTerrain(this);
  players = createPlayers(this, terrainBodies);
  currentTurn = 'player1';

  aimingLine = this.add.graphics();
  drawAimingLine(this);

  cursors = this.input.keyboard.createCursorKeys();
  spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

  arrow = this.add.triangle(0, 0, 10, 0, 20, 20, 0, 20, 0xff0000); // Create a triangle as an arrow
  arrow.setVisible(false); // Hide it initially

  if (!this.turnText) {
    this.turnText = this.add.text(this.scale.width / 2, 30, 'Turn: player1', {
      font: '28px Arial',
      fill: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.turnText.setOrigin(0.5)
    this.turnText.setShadow(2, 2, '#333333', 2, true, true); // Adding shadow for depth
  }
  this.turnText.setText(`Turn: ${currentTurn}`);

  if (!this.livesTextPlayer1) {
    this.livesTextPlayer1 = this.add.text(10, 70, '', {
      font: '24px Arial',
      fill: '#ff9900',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.livesTextPlayer1.setShadow(2, 2, '#333333', 2, true, true);
  }

  // Display player 2 lives with larger font and custom color on the right
  if (!this.livesTextPlayer2) {
    this.livesTextPlayer2 = this.add.text(this.scale.width - 10, 70, '', {
      font: '24px Arial',
      fill: '#ff9900',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.livesTextPlayer2.setOrigin(1, 0)
    this.livesTextPlayer2.setShadow(2, 2, '#333333', 2, true, true);
  }
  updateLivesText(this);

  // Display the winner (initially hidden)
  if (!this.winnerText) {
    this.winnerText = this.add.text(this.scale.width / 2, this.scale.height / 2, '', {
      font: '48px Arial',
      fill: '#ff0000',
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center'
    });
    this.winnerText.setOrigin(0.5); // Center the text
    this.winnerText.setShadow(5, 5, '#333333', 5, true, true);
    this.winnerText.setVisible(false); // Hide it initially
    this.winnerText.setDepth(10); // Ensure it appears on top of other elements

  }

}

function update() {
  // If game over, restart on spacebar press
  if (gameOver && Phaser.Input.Keyboard.JustUp(spaceBar)) {
    restartGame(this);
    return; // Skip further updates when the game is over
  }


  if (cursors.left.isDown) {
    angle -= 1; // Decrease angle
  } else if (cursors.right.isDown) {
    angle += 1; // Increase angle
  }

  // Ensure the angle stays within a reasonable range
  angle = Phaser.Math.Clamp(angle, 0, 90);

  // Draw the aiming line (now a straight line)
  drawAimingLine(this);


  // Show the arrow if the bullet is off-screen (above the top of the screen)
  if (isBulletActive && projectile && projectile.y < 0) {
    arrow.setVisible(true);
    arrow.x = Phaser.Math.Clamp(projectile.x, 10, this.scale.width - 10); // Follow bullet's horizontal position
    arrow.y = 10; // Position the arrow at the top of the screen
  } else {
    arrow.setVisible(false); // Hide the arrow if the bullet is on screen
  }

  // Start charging the power when space is held down, but only if no bullet is active
  if (spaceBar.isDown && !isCharging && !isBulletActive) {
    isCharging = true;
    power = minPower; // Start power at the minimum value
  }

  // Continue increasing power while holding space
  if (isCharging && spaceBar.isDown) {
    power += 5; // Increase power while holding
    power = Phaser.Math.Clamp(power, minPower, maxPower); // Clamp the power between minPower and maxPower
  }

  // Release the projectile when space is released, but only if no bullet is active
  if (isCharging && Phaser.Input.Keyboard.JustUp(spaceBar) && !isBulletActive) {
    isCharging = false;

    // Fire the projectile using the pre-calculated wind
    shootProjectile(this, players[currentTurn], angle, power, wind);

    power = minPower; // Reset power to the minimum after shooting
  }
}


function drawAimingLine(scene) {
  let player = players[currentTurn]; // Get the current player's tank
  let numPoints = 50; // Number of points to simulate for the trajectory
  let timeStep = 0.1; // Fixed time interval between each point (consistent with physics simulation)

  // Clear previous line
  aimingLine.clear();
  aimingLine.lineStyle(2, 0xff0000, 1); // Red line for aiming

  let playerAngle = angle;
  if (currentTurn === 'player2') {
    playerAngle = 180 - angle; // Flip the angle to shoot left
  }

  // Initial velocity based on angle and power
  let velocityX = Math.cos(Phaser.Math.DegToRad(playerAngle)) * power;
  let velocityY = -Math.sin(Phaser.Math.DegToRad(playerAngle)) * power; // Negative because Y increases downward

  // Starting position is the player's position
  let startX = player.x;
  let startY = player.y;

  // Draw the trajectory
  let previousX = startX;
  let previousY = startY;

  for (let i = 0; i < numPoints; i++) {
    // Calculate the position of the projectile at time t
    let t = i * timeStep; // Simulated time
    let x = startX + velocityX * t;
    let y = startY + velocityY * t + 0.5 * gravity * t * t; // Using the kinematic equation for position

    // Draw a line from the previous point to the current point
    aimingLine.lineBetween(previousX, previousY, x, y);

    // Update previous position to the current point
    previousX = x;
    previousY = y;

    // Stop if the trajectory goes below the ground (simple ground detection)
    if (y > scene.scale.height) {
      break;
    }
  }
}

// Shoot the projectile based on the angle and power
function shootProjectile(scene, player, angle, power, wind) {
  // Mark bullet as active to prevent new shots
  isBulletActive = true;

  let playerAngle = angle;
  if (currentTurn === 'player2') {
    playerAngle = 180 - angle; // Invert the angle to make player two shoot left
  }

  // Create the projectile at the player's position
  projectile = scene.physics.add.sprite(player.x, player.y, 'bullet');

  let velocityMultiplier = 1.5;
  // Calculate the velocity based on angle and power
  let velocityX = Math.cos(Phaser.Math.DegToRad(playerAngle)) * power * velocityMultiplier;
  let velocityY = -Math.sin(Phaser.Math.DegToRad(playerAngle)) * power * velocityMultiplier; // Negative because Y increases downward

  // Apply the wind effect to the horizontal velocity
  velocityX += wind; // Wind modifies the horizont    al speed of the bullet

  // Apply the velocity to the projectile
  projectile.setVelocity(velocityX, velocityY);

  // Let gravity affect the projectile (same gravity as in the drawAimingLine function)
  projectile.setGravityY(gravity);

  projectile.setCollideWorldBounds(true);
  projectile.body.onWorldBounds = true;
  scene.physics.world.setBoundsCollision(true, true, false, true); // Allow crossing the top border
  projectile.body.setSize(1, 1); // Set the collision body size to a single point
  projectile.body.setOffset(projectile.width / 2, projectile.height / 2); // Center the collision point
  projectile.body.world.on('worldbounds', function(body) {
    if (body.gameObject === projectile) {
      projectile.destroy(); // Destroy the bullet when it leaves the world bounds (except top)
      isBulletActive = false; // Mark bullet as inactive
      generateWind(scene); // Generate new wind
      switchTurn(scene);    // Switch to the next player's turn
    }
  });

  scene.physics.add.collider(projectile, players.player1, function() {
    handlePlayerHit(scene, 'player1'); // Player 1 is hit
  });
  scene.physics.add.collider(projectile, players.player2, function() {
    handlePlayerHit(scene, 'player2'); // Player 2 is hit
  });

  // Add collision detection for the bullet and the ground
  scene.physics.add.collider(projectile, terrainBodies, function() {
    projectile.destroy(); // Destroy the bullet when it hits the ground

    // Generate a new wind after collision
    generateWind(scene);

    switchTurn(scene);
    // Mark bullet as inactive after it hits the ground
    isBulletActive = false;
  });
}
function updateLivesText(scene) {
  scene.livesTextPlayer1.setText(`Lives: ${playerLives.player1}`);
  scene.livesTextPlayer2.setText(`Lives: ${playerLives.player2}`);
}

function displayWinner(scene, winner) {
  scene.winnerText.setText(`Winner is ${winner}!`);
  scene.winnerText.setVisible(true);
}

function restartGame(scene) {
  // Reset player lives
  playerLives = { player1: 3, player2: 3 };

  // Reset the game state
  gameOver = false;
  currentTurn = 'player1';
  scene.winnerText.setVisible(false); // Hide winner text
  updateLivesText(scene); // Reset lives display
}

function handlePlayerHit(scene, player) {
  projectile.destroy(); // Destroy the bullet
  isBulletActive = false;

  // Reduce player's life
  playerLives[player]--;
  updateLivesText(scene);

  // Check if the player has lost all lives
  if (playerLives[player] <= 0) {
    displayWinner(scene, player === 'player1' ? 'player2' : 'player1');
    gameOver = true;
  } else {
    switchTurn(scene); // Switch turn to the next player if no winner
    generateWind(scene); // Generate new wind
  }
}

function switchTurn(scene) {
  // Switch to the next player's turn
  if (currentTurn === 'player1') {
    currentTurn = 'player2';
  } else {
    currentTurn = 'player1';
  }

  // Update the turn display
  scene.turnText.setText(`Turn: ${currentTurn}`);
}


function generateWind(scene) {
  // Generate random wind for the next shot
  wind = Phaser.Math.Between(-100, 100);

  // Update the wind display (optional)
  if (!scene.windText) {
    scene.windText = scene.add.text(10, 10, '', { font: '16px Arial', fill: '#ffffff' });
  }
  scene.windText.setText(`Wind: ${wind}`);
}


// Terrain Generation (with interpolation and collision bodies)
function generateTerrain(scene) {
  let terrainGraphics = scene.add.graphics({ fillStyle: { color: 0x00FF00  } });
  let terrainHeight = [];
  let pointSpacing = 30; // Distance between points
  let roughness = 0.4; // Roughness for pointy terrain

  // Increase height variation
  let minHeight = 100; // Lower min height for valleys
  let maxHeight = 700; // Higher max height for peaks

  let previousHeight = Phaser.Math.Between(minHeight, maxHeight);
  terrainHeight.push(previousHeight);

  for (let x = pointSpacing; x < scene.scale.width; x += pointSpacing) {
    let newHeight = Phaser.Math.Between(minHeight, maxHeight);
    let smoothedHeight = Phaser.Math.Linear(previousHeight, newHeight, roughness);

    for (let i = 0; i < pointSpacing; i++) {
      let interpolationFactor = i / pointSpacing;
      let interpolatedHeight = Phaser.Math.Linear(previousHeight, smoothedHeight, interpolationFactor);
      terrainHeight.push(interpolatedHeight);

      // Draw the terrain
      terrainGraphics.fillRect(x - pointSpacing + i, interpolatedHeight, 1, scene.scale.height - interpolatedHeight);

      // Create a static body for the terrain without scaling to avoid visual artifacts
      let groundBlock = terrainBodies.create(x - pointSpacing + i, interpolatedHeight + 1, 'ground'); // Align ground to terrain
      groundBlock.setOrigin(0, 0); // Set origin at top-left corner
      groundBlock.displayHeight = scene.scale.height - interpolatedHeight; // Set the block's height dynamically
      groundBlock.displayWidth = 1; // Ensure ground block is only 1 pixel wide to avoid gaps
      groundBlock.refreshBody(); // Refresh to update the physics body
    }

    previousHeight = smoothedHeight;
  }

  return terrainHeight;
}


// Player Creation
function createPlayers(scene, terrainBodies) {
  let player1 = scene.physics.add.sprite(100, 50, 'tank1'); // Start tanks above the terrain to fall onto it
  let player2 = scene.physics.add.sprite(700, 50, 'tank2');

  player1.setCollideWorldBounds(true);
  player2.setCollideWorldBounds(true);

  // Colliders between players and terrain
  scene.physics.add.collider(player1, terrainBodies);
  scene.physics.add.collider(player2, terrainBodies);

  return { player1, player2 };
}