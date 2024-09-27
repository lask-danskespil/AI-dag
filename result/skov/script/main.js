// Splash Screen Scene
class SplashScene extends Phaser.Scene {
  constructor() {
      super({ key: 'SplashScene' });
  }

  preload() {
      this.load.image('logo', 'assets/logo.png'); // Add the logo image
      this.load.image('startButton', 'assets/startButton.png'); // Start button image
  }

  create() {
      // Add gradient background to the splash scene
      this.createGradientBackground();

      // Add logo image
      this.logo = this.add.image(400, 200, 'logo');
      this.logo.setScale(0.5); // Adjust scale as needed

      // Add start button and make it interactive
      this.startButton = this.add.image(400, 400, 'startButton').setInteractive();

      // Start the main game when the button is clicked
      this.startButton.on('pointerdown', () => {
          this.scene.start('MainScene'); // Switch to the main game scene
      });
  }

  // Function to create the gradient background (same as in MainScene)
  createGradientBackground() {
      let graphics = this.add.graphics();

      // Create a vertical gradient (top to bottom) using fillGradientStyle
      graphics.fillGradientStyle(0xfba65a, 0xffcb6b, 0xff8f50, 0xff7591, 1);
      graphics.fillRect(0, 0, 800, 600); // Cover the entire screen
  }
}

// Main Game Scene
class MainScene extends Phaser.Scene {
  constructor() {
      super({ key: 'MainScene' });
  }

  preload() {
      this.load.image('clamBottom', 'assets/clam-bottom.png'); // Bottom clam image
      this.load.image('clamTop', 'assets/clam-top.png');       // Top clam image
      this.load.image('beaver', 'assets/beaver.png');          // Beaver image
      this.load.image('stone', 'assets/stone.png');            // Stone image
      this.load.image('startButton', 'assets/startButton.png'); // Start button image
  }

  create() {
      this.gameOver = false;
      this.score = 0;

      // Add gradient background in the main game scene
      this.createGradientBackground();

      // Add the bottom clam with physics, origin set to the top-right corner
      this.clamBottom = this.physics.add.sprite(400, 550, 'clamBottom')
          .setOrigin(1, 0) // Origin in top-right corner
          .setCollideWorldBounds(true);

      // Add the top clam, origin set to the bottom-right corner
      this.clamTop = this.physics.add.sprite(400, 550, 'clamTop')
          .setOrigin(1, 1) // Origin in bottom-right corner
          .setCollideWorldBounds(true);

      // Create groups for beavers and stones
      this.beaverGroup = this.physics.add.group();
      this.stoneGroup = this.physics.add.group();

      // Add collider between the top clam and the objects
      this.physics.add.overlap(this.clamTop, this.beaverGroup, this.catchBeaver, null, this);
      this.physics.add.overlap(this.clamTop, this.stoneGroup, this.catchStone, null, this);

      // Display score
      this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });

      // Spawn beavers and stones every 1 second (store timer reference)
      this.spawnTimer = this.time.addEvent({
          delay: 1000,
          callback: this.spawnObjects,
          callbackScope: this,
          loop: true
      });

      // Add keyboard controls
      this.cursors = this.input.keyboard.createCursorKeys();

      // Create the start button but hide it initially
      this.startButton = this.add.image(400, 300, 'startButton').setInteractive();
      this.startButton.setVisible(false);  // Hide at the start

      // Restart the game when the start button is clicked
      this.startButton.on('pointerdown', () => {
          this.scene.restart();  // Restart the MainScene
      });
  }

  update() {
      if (this.gameOver) return;

      // Move both clam parts left and right with the same velocity
      if (this.cursors.left.isDown) {
          this.clamBottom.setVelocityX(-350);
          this.clamTop.setVelocityX(-350);
      } else if (this.cursors.right.isDown) {
          this.clamBottom.setVelocityX(350);
          this.clamTop.setVelocityX(350);
      } else {
          this.clamBottom.setVelocityX(0);
          this.clamTop.setVelocityX(0);
      }

      // Keep the top clam horizontally aligned with the bottom clam
      this.clamTop.x = this.clamBottom.x;
      // Keep the top clam vertically aligned, so it stays "hinged" at the right side of the bottom clam
      this.clamTop.y = this.clamBottom.y;
  }

  // Function to create the gradient background
  createGradientBackground() {
      let graphics = this.add.graphics();

      // Create a vertical gradient (top to bottom) using fillGradientStyle
      graphics.fillGradientStyle(0xfba65a, 0xffcb6b, 0xff8f50, 0xff7591, 1);
      graphics.fillRect(0, 0, 800, 600); // Cover the entire screen
  }

  // Function to spawn either a beaver or a stone randomly
  spawnObjects() {
      const spawnX = Phaser.Math.Between(0, 800); // Random x position between 0 and 800
      const spawnY = Phaser.Math.Between(-100, -50); // Random y position higher than visible screen

      if (Phaser.Math.Between(0, 1) === 0) {
          // Spawn a beaver, offscreen
          let beaver = this.beaverGroup.create(spawnX, spawnY, 'beaver');
          beaver.setVelocityY(Phaser.Math.Between(100, 200));
      } else {
          // Spawn a stone, offscreen
          let stone = this.stoneGroup.create(spawnX, spawnY, 'stone');
          stone.setVelocityY(Phaser.Math.Between(100, 200));
      }
  }

  // Function when a beaver is caught
  catchBeaver(clamTop, beaver) {
      beaver.destroy();
      this.score += 1;
      this.scoreText.setText('Score: ' + this.score);

      // Rotate the top clam 90 degrees clockwise (to look like it's open)
      this.clamTop.setAngle(90);

      // Switch back to closed clam position after a short delay (500ms)
      this.time.delayedCall(500, () => {
          this.clamTop.setAngle(0); // Reset the top clam back to its original state
      }, [], this);
  }

  // Function when a stone is caught (game over)
  catchStone(clamTop, stone) {
      stone.destroy();
      this.physics.pause();
      this.clamBottom.setTint(0xff0000);  // Red tint to indicate game over
      this.clamTop.setTint(0xff0000);     // Red tint to indicate game over
      this.gameOver = true;
      this.spawnTimer.remove(); // Stop the spawn timer when the game is over
      this.scoreText.setText('Game Over! Final Score: ' + this.score);

      // Show the start button to allow restarting the game
      this.startButton.setVisible(true);
  }
}

// Configuration for the Phaser game
let config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
      default: 'arcade',
      arcade: {
          gravity: { y: 300 }, // Apply gravity so beavers and stones fall
          debug: false
      }
  },
  scene: [SplashScene, MainScene] // Use both SplashScene and MainScene
};

let game = new Phaser.Game(config);
