function getLevelInfo (level) {
  const levels = [
    [
      [1,1,1,1,1,1,1],
      [2,2,2,2,2,2,2],
      [3,3,3,3,3,3,3]
    ],
    [
      [1,3,1,0,1,3,1],
      [2,2,0,1,0,2,2],
      [3,0,1,0,1,0,3],
      [3,3,3,0,3,3,3]
    ],
    [
      [3,1,0,2,0,1,3],
      [1,0,2,3,2,0,1],
      [3,1,0,2,0,1,3],
      [1,1,1,1,1,1,1]
    ],
    [
      [3,3,2,3,2,3,3],
      [1,1,1,1,1,1,1],
      [4,4,2,4,2,4,4]
    ],
  ]

  if (level != null)
    return levels[level];

  return levels.length;
}

function getBrickInfo () {
  return {
    common: {
      width: 50,
      height: 20,
      offset: {
        top: 50,
        left: 60
      },
      padding: 10
    },
    bricks: [
      {},
      {
        lives: 3,
        points: 30
      },
      {
        lives: 2,
        points: 20
      },
      {
        lives: 1,
        points: 10
      },
      {
        lives: 1,
        indestructible: true,
        points: 50
      }
    ]
  }
}
