const {
  CANVAS,
  Easing,
  Physics,
  Keyboard,
  ScaleManager
} = Phaser;

const game = new Phaser.Game(480, 320, CANVAS, null, { preload: preload, create: create, update: update });

let levelMax = getLevelInfo(), currentLevel = 0;
let ball, paddle, bricks;
let score = 0, coeff = 1, bricksDestroyed = 0, bricksIndestructable = 0, bricksTotal;
let combo = 0, comboScore = 0, comboText;
let lives = 3, livesText, lifeLostText, scoreText, levelText, textStyle = { font: "18px Arial", fill: "#0095DD" };
let Playing = false;
let startButton;
const ball_velocity = 175;

function preload() {
  game.scale.scaleMode = ScaleManager.SHOW_ALL;
  game.scale.pageAlignHorizontally = true;
  game.scale.pageAlignVertically = true;

  game.stage.backgroundColor = "#eee";

  game.load.image("paddle", "img/paddle.png");
  game.load.spritesheet("brick1", "img/bricks/001.png", 50, 20);
  game.load.spritesheet("brick2", "img/bricks/002.png", 50, 20);
  game.load.image("brick3", "img/bricks/003.png");
  game.load.image("brick4", "img/bricks/004.png");
  game.load.spritesheet("ball", "img/wobble.png", 20, 20);
  game.load.spritesheet("button", "img/button.png", 120, 40);
}

function create() {
  game.physics.startSystem(Physics.ARCADE);

  ball = game.add.sprite(game.world.width * 0.5, game.world.height - 25, "ball");
  ball.animations.add("wobble", [0,1,0,2,0,1,0,2,0], 24);
  ball.anchor.set(0.5);
  game.physics.enable(ball, Physics.ARCADE);
  ball.body.bounce.set(1);
  ball.body.collideWorldBounds = true;
  game.physics.arcade.checkCollision.down = false;
  ball.checkWorldBounds = true;
  ball.events.onOutOfBounds.add(ballLeaveScreen, this);

  paddle = game.add.sprite(game.world.width * 0.5, game.world.height - 5, "paddle");
  paddle.anchor.set(0.5, 1);
  game.physics.enable(paddle, Physics.ARCADE);
  paddle.body.immovable = true;
  paddle.x = game.world.width * 0.5;

  scoreText = game.add.text(5, 5, "Points: 0 ×1", textStyle);
  comboText = game.add.text(game.world.width * 0.5, 250, "Combo: ×1 -- Extra score: 0", textStyle);
  comboText.anchor.set(0.5);
  comboText.visible = false;

  livesText = game.add.text(game.world.width - 5, 5, `Lives: ${lives}`, textStyle);
  livesText.anchor.set(1, 0);
  lifeLostText = game.add.text(game.world.width * 0.5, game.world.height * 0.5, "Life lost, click or 'spacebar' to continue", textStyle);
  lifeLostText.anchor.set(0.5);
  lifeLostText.visible = false;

  levelText = game.add.text(game.world.width * 0.5, 210, `Level ${currentLevel + 1}`, textStyle);
  levelText.anchor.set(0.5);
  levelText.visible = false;

  game.input.addMoveCallback(function () { if (Playing) paddle.x = game.input.x }, this);

  nextLevel();
}

function update() {
  if (Playing) {
    game.physics.arcade.collide(ball, paddle, ballHitPaddle);
    game.physics.arcade.collide(ball, bricks, ballHitBrick);

    if (game.input.keyboard.isDown(Keyboard.LEFT))
      paddle.x -= 6;
    else if (game.input.keyboard.isDown(Keyboard.RIGHT))
      paddle.x += 6;

    if (paddle.x - paddle.width / 2 < 0)
      paddle.x = paddle.width / 2;
    if (paddle.x + paddle.width / 2 > game.width)
      paddle.x = game.width - paddle.width / 2;
  }
}

function startGame() {
  startButton.destroy();
  ball.body.velocity.set(ball_velocity, -ball_velocity);
  Playing = true;
}

function initBricks() {
  const levelInfo = getLevelInfo(currentLevel);
  const brickInfo = getBrickInfo();

  bricks = game.add.group();

  for (let r = 0; r < levelInfo.length; r++)
    for (let c = 0; c < levelInfo[0].length; c++) {
      const brickId = levelInfo[r][c];

      if (brickId == 4)
        bricksIndestructable++;

      if (brickId > 0) {
        const brickX = (c * (brickInfo.common.width + brickInfo.common.padding)) + brickInfo.common.offset.left;
        const brickY = (r * (brickInfo.common.height + brickInfo.common.padding)) + brickInfo.common.offset.top;
        const newBrick = game.add.sprite(brickX, brickY, `brick${brickId}`);
        newBrick.data = {
          score: brickInfo.bricks[brickId].points,
          lives: brickInfo.bricks[brickId].lives,
          indestructible: brickInfo.bricks[brickId].indestructible || false
        };
        game.physics.enable(newBrick, Physics.ARCADE);
        newBrick.body.immovable = true;
        newBrick.anchor.set(0.5);
        bricks.add(newBrick);
      }
    }

  bricksTotal = bricks.children.length;
}

function ballHitBrick(ball, brick) {
  if (!brick.data.indestructible) {
    brick.frame++;
    if (--brick.data.lives == 0) {
      bricksDestroyed++;
      combo++;

      const killTween = game.add.tween(brick.scale);
      killTween.to({ x: 0, y: 0 }, 200, Easing.Linear.None);
      killTween.onComplete.addOnce(() => {
        brick.kill();

        bricksTotal--;
        if (bricksTotal == 0 || bricksTotal == bricksIndestructable) {
          checkCombo();
          if (currentLevel + 1 == levelMax) {
            alert(`You won the game, congratulations!\n${score} points earned!`);
            location.reload();
          } else {
            currentLevel++;
            nextLevel();
          }
        }
      }, this);
      killTween.start();

      score += brick.data.score * coeff;
      comboScore += brick.data.score * coeff;
      if (bricksDestroyed % 5 == 0)
        coeff = +(coeff + 0.1).toFixed(1);
      scoreText.setText(`Points: ${score} ×${coeff}`);
    }
  }

  everyHit();
}

function ballHitPaddle(ball, paddle) {
  ball.body.velocity.x = -5 * (paddle.x - ball.x);
  checkCombo();
  everyHit();
}

function everyHit() {
  ball.animations.play("wobble");
}

function ballLeaveScreen() {
  livesText.setText(`Lives: ${lives - 1}`);

  if (--lives) {
    checkCombo();

    lifeLostText.visible = true;

    ball.reset(game.world.width * 0.5, game.world.height - 25);

    coeff = 1;
    bricksDestroyed = 0;
    scoreText.setText(`Points: ${score} ×${coeff}`);

    game.input.onDown.addOnce(() => {
      lifeLostText.visible = false;
      ball.body.velocity.set(ball_velocity, -ball_velocity);
    }, this);
    game.input.keyboard.addKey(Keyboard.SPACEBAR).onDown.addOnce(() => {
      lifeLostText.visible = false;
      ball.body.velocity.set(ball_velocity, -ball_velocity);
    });
  } else {
    alert("You lost, game over!");
    location.reload();
  }
}

function checkCombo () {
  if (combo > 1) {
    const extraScore = comboScore * (combo - 1);
    score += extraScore;
    scoreText.setText(`Points: ${score} ×${coeff}`);
    comboText.setText(`Combo: ×${combo} -- Extra score: ${extraScore}`);
    comboText.visible = true;
    setTimeout(() => {
      comboText.visible = false;
    }, 1000);
  }
  [combo, comboScore] = [0, 0];
}

function nextLevel () {
  levelText.setText(`Level ${currentLevel + 1} / ${levelMax}`);
  levelText.visible = true;
  setTimeout(() => {
    levelText.visible = false;
  }, 2000);

  ball.reset(game.world.width * 0.5, game.world.height - 25);

  initBricks();

  startButton = game.add.button(game.world.width * 0.5, game.world.height * 0.5, "button", startGame, this, 1, 0, 2);
  startButton.anchor.set(0.5);
  game.input.keyboard.addKey(Keyboard.SPACEBAR).onDown.addOnce(startGame);
}
