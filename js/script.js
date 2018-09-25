const game = new Phaser.Game(480, 320, Phaser.CANVAS, null, { preload: preload, create: create, update: update });

let ball, paddle, bricks;
let score = 0, coeff = 1, bricksDestroyed = 0, bricksTotal;
let combo = 0, comboScore = 0, comboText;
let lives = 3, livesText, lifeLostText, scoreText, textStyle = { font: "18px Arial", fill: "#0095DD" };
let Playing = false;
let startButton;
const ball_velocity = 175;

function preload() {
  game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
  game.scale.pageAlignHorizontally = true;
  game.scale.pageAlignVertically = true;

  game.stage.backgroundColor = "#eee";

  game.load.image("paddle", "img/paddle.png");
  game.load.image("brick01", "img/brick01.png");
  game.load.image("brick02", "img/brick02.png");
  game.load.image("brick03", "img/brick03.png");
  game.load.spritesheet("ball", "img/wobble.png", 20, 20);
  game.load.spritesheet("button", "img/button.png", 120, 40);
}

function create() {
  game.physics.startSystem(Phaser.Physics.ARCADE);

  ball = game.add.sprite(game.world.width * 0.5, game.world.height - 25, "ball");
  ball.animations.add("wobble", [0,1,0,2,0,1,0,2,0], 24);
  ball.anchor.set(0.5);
  game.physics.enable(ball, Phaser.Physics.ARCADE);
  ball.body.bounce.set(1);
  ball.body.collideWorldBounds = true;
  game.physics.arcade.checkCollision.down = false;
  ball.checkWorldBounds = true;
  ball.events.onOutOfBounds.add(ballLeaveScreen, this);

  paddle = game.add.sprite(game.world.width * 0.5, game.world.height - 5, "paddle");
  paddle.anchor.set(0.5, 1);
  game.physics.enable(paddle, Phaser.Physics.ARCADE);
  paddle.body.immovable = true;

  initBricks();

  scoreText = game.add.text(5, 5, "Points: 0 ×1", textStyle);
  comboText = game.add.text(game.world.width * 0.5, 220, "Combo: ×1 -- Extra score: 0", textStyle);
  comboText.anchor.set(0.5);
  comboText.visible = false;

  livesText = game.add.text(game.world.width - 5, 5, `Lives: ${lives}`, textStyle);
  livesText.anchor.set(1, 0);
  lifeLostText = game.add.text(game.world.width * 0.5, game.world.height * 0.5, "Life lost, click to continue", textStyle);
  lifeLostText.anchor.set(0.5);
  lifeLostText.visible = false;

  startButton = game.add.button(game.world.width * 0.5, game.world.height * 0.5, "button", startGame, this, 1, 0, 2);
  startButton.anchor.set(0.5);
}

function update() {
  if (Playing) {
    game.physics.arcade.collide(ball, paddle, ballHitPaddle);
    game.physics.arcade.collide(ball, bricks, ballHitBrick);

    paddle.x = game.input.x || game.world.width * 0.5;
  }
}

function startGame() {
  startButton.destroy();
  ball.body.velocity.set(ball_velocity, -ball_velocity);
  Playing = true;
}

function initBricks() {
  const brickInfo = {
    width: 50,
    height: 20,
    count: {
      row: 3,
      col: 7
    },
    offset: {
      top: 50,
      left: 60
    },
    padding: 10
  }

  bricks = game.add.group();

  for (let r = 0; r < brickInfo.count.row; r++)
    for (let c = 0; c < brickInfo.count.col; c++) {
      const brickX = (c * (brickInfo.width + brickInfo.padding)) + brickInfo.offset.left;
      const brickY = (r * (brickInfo.height + brickInfo.padding)) + brickInfo.offset.top;
      const newBrick = game.add.sprite(brickX, brickY, `brick0${r + 1}`);
      newBrick.data = { score: 10 * (brickInfo.count.row - r) };
      game.physics.enable(newBrick, Phaser.Physics.ARCADE);
      newBrick.body.immovable = true;
      newBrick.anchor.set(0.5);
      bricks.add(newBrick);
    }

  bricksTotal = bricks.children.length;
}

function ballHitBrick(ball, brick) {
  bricksDestroyed++;
  combo++;

  const killTween = game.add.tween(brick.scale);
  killTween.to({ x: 0, y: 0 }, 200, Phaser.Easing.Linear.None);
  killTween.onComplete.addOnce(() => {
    brick.kill();

    bricksTotal--;
    if (bricksTotal == 0) {
      alert("You won the game, congratulations!");
      location.reload();
    }
  }, this);
  killTween.start();

  score += brick.data.score * coeff;
  comboScore += brick.data.score * coeff;
  if (bricksDestroyed % 5 == 0)
    coeff = +(coeff + 0.1).toFixed(1);
  scoreText.setText(`Points: ${score} ×${coeff}`);

  everyHit();
}

function ballHitPaddle(ball, paddle) {
  if (combo > 1) {
    const extraScore = comboScore * (combo - 1);
    score += extraScore;
    scoreText.setText(`Points: ${score} ×${coeff}`);
    comboText.setText(`Combo: ×${combo} -- Extra score: ${extraScore}`);
    comboText.visible = true;
    setTimeout(() => {
      comboText.visible = false;
    }, 1500);
  }
  [combo, comboScore] = [0, 0];

  ball.body.velocity.x = -5 * (paddle.x - ball.x);

  everyHit();
}

function everyHit() {
  ball.animations.play("wobble");
}

function ballLeaveScreen() {
  lives--;
  if (lives) {
    livesText.setText(`Lives: ${lives}`);
    lifeLostText.visible = true;
    ball.reset(game.world.width * 0.5, game.world.height - 25);
    paddle.reset(game.world.width * 0.5, game.world.height - 5);
    game.input.onDown.addOnce(() => {
      lifeLostText.visible = false;
      ball.body.velocity.set(ball_velocity, -ball_velocity);
    }, this);
  } else {
    alert("You lost, game over!");
    location.reload();
  }
}
