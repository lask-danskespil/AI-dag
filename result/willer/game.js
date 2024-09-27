const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: true // Aktivér debug mode
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let paddle;
let ball;
let bricks;
let cursors;
let score = 0;
let timerText;
let scoreText;
let initialTime = 120; // 2 minutter (120 sekunder)
let timerEvent;
let level = 1; // Start ved level 1
let gameOverFlag = false; // For at sikre, at Game Over kun sker én gang
let bottomCollider; // Collider til bunden af skærmen

function preload() {
    this.load.image('paddle', 'assets/paddle.png'); // Sørg for at filstien er korrekt
    this.load.image('ball', 'assets/ball.png'); // Sørg for at filstien er korrekt
    this.load.image('brick', 'assets/brick.png'); // Sørg for at filstien er korrekt
}

function create() {
    createPaddleAndBall.call(this);
    createBricks.call(this);
    createTexts.call(this);

    // Tilføj input (piletaster)
    cursors = this.input.keyboard.createCursorKeys();

    // Start timer
    startTimer.call(this);

    // Opret en synlig collider i bunden af skærmen til debugging
    bottomCollider = this.add.rectangle(400, 590, 800, 20, 0xff0000, 0.5); // Gør den halv-transparent for synlighed
    bottomCollider.setOrigin(0.5, 0); // Justér origin til toppen
    this.physics.add.existing(bottomCollider, true); // Gør den til en statisk fysik-krop

    // Tilføj collision mellem bold og bund-collider
    this.physics.add.collider(ball, bottomCollider, onBottomCollision, null, this);

     // Tegn en cirkel i midten af spillet
     let graphics = this.add.graphics({ fillStyle: { color: 0x00ff00 } }); // Grøn farve
     graphics.fillCircle(400, 300, 50); // Tegn en cirkel med radius 50 i midten af skærmen
}

function update() {
    // Flyt paddle
    if (cursors.left.isDown) {
        paddle.setVelocityX(-500);
    } else if (cursors.right.isDown) {
        paddle.setVelocityX(500);
    } else {
        paddle.setVelocityX(0);
    }

    // Debug: Udskriv boldens position
    console.log(`Ball Position - X: ${ball.x}, Y: ${ball.y}`);

    // Hvis bolden falder forbi paddle (backup check)
    if (ball.y > 600 && !gameOverFlag) {
        gameOver.call(this);
    }
}

function createPaddleAndBall() {
    // Opret paddle
    paddle = this.physics.add.sprite(400, 550, 'paddle').setImmovable();
    paddle.body.allowGravity = false;
    paddle.setCollideWorldBounds(true);

    // Opret bold med justeret origin
    ball = this.physics.add.sprite(400, 500, 'ball');
    ball.setCollideWorldBounds(true);
    ball.setBounce(1);
    ball.setVelocity(-75, -300);
    ball.setOrigin(0.5, 1); // Justér origin til bunden
    // Kollisionshåndtering
    this.physics.add.collider(ball, paddle, hitPaddle, null, this);
}

function createBricks() {
    // Opret mur af klodser
    bricks = this.physics.add.staticGroup({
        key: 'brick',
        frameQuantity: 24,
        gridAlign: { width: 8, height: 3, cellWidth: 100, cellHeight: 50, x: 100, y: 100 }
    });

    // Kollisionshåndtering
    this.physics.add.collider(ball, bricks, hitBrick, null, this);
}

function createTexts() {
    // Tilføj score tekst
    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#FFF' });

    // Tilføj timer tekst
    timerText = this.add.text(600, 16, 'Time: 2:00', { fontSize: '32px', fill: '#FFF' });
}

function startTimer() {
    initialTime = 120 - (level - 1) * 30; // Reduktion i tid for hvert level
    timerText.setText(`Time: ${Math.floor(initialTime / 60)}:${initialTime % 60 < 10 ? '0' : ''}${initialTime % 60}`);
    timerEvent = this.time.addEvent({
        delay: 1000, // 1 sekund
        callback: updateTimer,
        callbackScope: this,
        loop: true
    });
}

function hitPaddle(ball, paddle) {
    let diff = 0;
    if (ball.x < paddle.x) {
        diff = paddle.x - ball.x;
        ball.setVelocityX(-10 * diff);
    } else if (ball.x > paddle.x) {
        diff = ball.x - paddle.x;
        ball.setVelocityX(10 * diff);
    } else {
        ball.setVelocityX(2 + Math.random() * 8);
    }
}

function hitBrick(ball, brick) {
    brick.disableBody(true, true);

    // Beregn point baseret på resterende tid
    let remainingTime = timerEvent.getRemainingSeconds();
    if (remainingTime <= 30) {
        score += 5;
    } else if (remainingTime <= 60) {
        score += 3;
    } else {
        score += 1;
    }
    scoreText.setText('Score: ' + score);

    // Tjek om alle klodser er væk
    if (bricks.countActive() === 0) {
        if (level < 3) {
            // Gå til næste level
            levelUp.call(this);
        } else {
            // Spillet vundet
            gameWin.call(this);
        }
    }
}

function updateTimer() {
    initialTime -= 1; // Fjern 1 sekund fra tiden

    // Opdater timer tekst
    let minutes = Math.floor(initialTime / 60);
    let seconds = initialTime % 60;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    timerText.setText('Time: ' + minutes + ':' + seconds);

    // Hvis tiden er løbet ud, stop spillet
    if (initialTime <= 0 && !gameOverFlag) {
        gameOver.call(this);
    }
}

function resetBall() {
    ball.setVelocity(0);
    ball.setPosition(paddle.x, 500);
    this.input.once('pointerdown', function() {
        ball.setVelocity(-75, -300);
    }, this);
}

// Funktion der håndterer kollision med bunden
function onBottomCollision() {
    console.log('Collision with bottom detected!'); // Debug
    console.log(`Ball Position - X: ${ball.x}, Y: ${ball.y}`);
    console.log(`Bottom Collider - X: ${bottomCollider.x}, Y: ${bottomCollider.y}`);
    gameOver.call(this);
}

function gameOver() {
    if (!gameOverFlag) {
        gameOverFlag = true; // Undgå gentagne game over kald
        this.add.text(300, 300, 'Game Over!', { fontSize: '64px', fill: '#FFF' });
        this.add.text(300, 400, 'Final Score: ' + score, { fontSize: '32px', fill: '#FFF' });
        this.physics.pause();
        ball.setTint(0xff0000);
        paddle.setTint(0xff0000);
        timerEvent.remove(); // Stop timer eventet
    }
}

function gameWin() {
    this.add.text(300, 300, 'You Win!', { fontSize: '64px', fill: '#FFF' });
    this.add.text(300, 400, 'Final Score: ' + score, { fontSize: '32px', fill: '#FFF' });
    this.physics.pause();
    ball.setTint(0x00ff00);
    paddle.setTint(0x00ff00);
    timerEvent.remove(); // Stop timer eventet
}

function levelUp() {
    level += 1;
    this.add.text(300, 300, 'Level Up!', { fontSize: '64px', fill: '#FFF' });
    ball.setVelocity(0);
    this.physics.pause();

    this.time.delayedCall(2000, () => {
        this.physics.resume();
        bricks.clear(true, true); // Ryd de gamle klodser
        createBricks.call(this);
        resetBall.call(this);
        startTimer.call(this);
    }, [], this);
}
