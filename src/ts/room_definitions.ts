///<reference path="colors.ts"/>
///<reference path="sound.ts"/>

const DEFAULT_DEPTH = 3;

type RoomFeatureFactory = (world: World, x: number, y: number, alternateAngle: boolean | number, originalChar: string) => void;

type RoomDefinition = {
  depthZ?: number,
  ambientLight?: number,
  layout: string,
  adjoiningRooms?: number,
  // floorPalette?: Vector4[],
  // wallPalette?: Vector4[],
};

// GLOBALS!!!
let modelPerimeters: PerimeterPoint[][][];
let mainProgramInputs: MainProgramInputs;
const STEP_SOUND = lazySoundEffect((audioContext) => webAudioBoomSoundEffectFactory(audioContext, .05, .02, 2e3, .06, .03));
const RUN_SOUND = lazySoundEffect((audioContext) => webAudioBoomSoundEffectFactory(audioContext, .05, .01, 1e3, .2, .1));
const MONSTER_SHUFFLE_SOUND = lazySoundEffect((audioContext) => webAudioBoomSoundEffectFactory(audioContext, .03, .02, 799, .15, .07));
const CHOKING_SOUND = lazySoundEffect((audioContext) => webAudioBoomSoundEffectFactory(audioContext, .5, .2, 499, .1, .05));
const SWITCH_SOUND = lazySoundEffect((audioContext) => webAudioBoomSoundEffectFactory(audioContext, .02, 0, 3e3, .2, .1));
const DOOR_SOUND = lazySoundEffect((audioContext) => webAudioBoomSoundEffectFactory(audioContext, .5, .3, 2e3, .07, 0));

let nextEntityId = 10;
const makeStaticEntity = (
  modelId: number,
  cx: number,
  cy: number,
  dimension: number,
  collisionType: CollisionType,
  alternateAngle: boolean | number,
  palette: Vector4[],
  centered?: 0 | 1,
  z?: number
): Entity => {
  const rx = cx / CONST_ROOM_DIMENSION | 0;
  const ry = cy / CONST_ROOM_DIMENSION | 0;

  const roomDefinition = roomDefinitions[rx][ry];
  const lrx = (cx | 0) - rx * CONST_ROOM_DIMENSION;
  const lry = (cy | 0) - ry * CONST_ROOM_DIMENSION;

  const rightChar = roomDefinition.layout[lry*CONST_ROOM_DIMENSION + lrx+1];
  const leftChar = roomDefinition.layout[lry*CONST_ROOM_DIMENSION + lrx-1];
  const belowChar = roomDefinition.layout[(lry+1)*CONST_ROOM_DIMENSION + lrx];
  const aboveChar = roomDefinition.layout[(lry-1)*CONST_ROOM_DIMENSION + lrx]

  const zRotation = alternateAngle
      ? rightChar == '#' || lrx == CONST_ROOM_DIMENSION-1 || leftChar != '#' && lrx > CONST_ROOM_DIMENSION/2
          ? CONST_PI_3DP
          : 0
      : belowChar == '#' || lry == CONST_ROOM_DIMENSION-1 || aboveChar != '#' && lry > CONST_ROOM_DIMENSION/2
          ? -CONST_PI_ON_2_3DP
          : CONST_PI_ON_2_3DP

  const halfBounds = mainProgramInputs.modelBuffers[modelId].halfBounds;
  const scale = mathAbs(dimension)*.5/halfBounds[dimension>0 ? 0 : 1];
  const perimeter = collisionType < 0 // static collision
      ? getPerimeter(models[modelId], modelPerimeters[modelId], FACE_TOP)
          .map(p => {
            const position = [...p.pos] as Vector2;
            // up is down
            position[1] *= -1;
            return vector2Rotate(CONST_PI_ON_2_1DP, position);
          })
          .map(p => p.map(v => v * scale) as Vector2)
      : 0;
  // const zRotation = alternateAngle
  //     ? cx - rx * ROOM_DIMENSION < ROOM_DIMENSION/2
  //           ? 0
  //           : mathPI
  //     : cy - ry * ROOM_DIMENSION < ROOM_DIMENSION/2
  //           ? mathPI/2
  //           : -mathPI/2;

  const dimensions = halfBounds.map(d => d * scale) as Vector3;
  const rotatedDimensions = vector2Rotate(-zRotation, dimensions);
  const rotatedPosition = vector2Rotate(-zRotation, [cx, cy, z || 0]);
  rotatedPosition[0] -= .5-mathAbs(rotatedDimensions[0]);
  const position: Vector3 = centered
    ? [cx, cy, z || 0]
    : vector2Rotate(zRotation, rotatedPosition) as Vector3;

  const collisionRadiusAdjust = collisionType == COLLISION_TYPE_DYNAMIC
      ? .7
      : 1;
  return {
    id: nextEntityId++,
    depthZ: halfBounds[2] * 2 * scale,
    pos: position,
    collisionRadius: vectorNLength(halfBounds.slice(0, 2).concat(0)) * scale * collisionRadiusAdjust,
    renderRadius: vectorNLength(halfBounds) * scale,
    body: {
      id: 0,
      attachmentTransform: matrix4MultiplyStack([
        matrix4Scale(scale),
        matrix4Translate(0, 0, halfBounds[2]),
      ]),
      modelId,
    },
    palette,
    velocity: [0, 0, 0],
    zRotation,
    collisionType,
    perimeter,
  };
}

const switchFeatureFactory = (world: World, x: number, y: number, alternateAngle: boolean | number, char: string) => {
  const circuit = char.toLowerCase().charCodeAt(0) - 97; // a
  const palette: Vector4[] = [
    COLOR_WHITE,
    COLOR_GREY,
    COLOR_GREY,
    COLOR_GREY,
  ];
  const doorSwitch = circuit < CONST_DOOR_SWITCH_CUT_OFF;

  const entity = doorSwitch
      ? makeStaticEntity(MODEL_ID_DOOR_SWITCH, x, y, .08, COLLISION_TYPE_SENSOR, alternateAngle, palette, 0, 1.3) as SwitchEntity
      : makeStaticEntity(MODEL_ID_LIGHT_SWITCH, x, y, .08, COLLISION_TYPE_SENSOR, alternateAngle, palette, 0, 1.3) as SwitchEntity;
  entity.collisionRadius = .7;
  entity.intelligence = INTELLIGENCE_ARTIFICIAL_SWITCH;
  entity.circuit = circuit;
  if (doorSwitch) {
    entity.badges = {
      0: [[1.4, 0, 2, circuitSymbols[circuit]]],
    };
  }
  world.switches.push(entity);
  addEntity(world, entity);
}

// fucking emoji card suits are out of order
const circuitSymbols: number[] = [
  62, // warning
  8, // ♠
  13,// ♥
  14,// ♦
  11, // ♣
  62, // also warning, IDGAF
  12, // ♤
  9, // ♡
  10, // ♢
  15, // ♧
];

const lightFeatureFactory = (world: World, x: number, y: number, alternateAngle: boolean | number, char: string) => {
  const circuit = parseInt(char);
  const rx = x/CONST_ROOM_DIMENSION | 0;
  const ry = y/CONST_ROOM_DIMENSION | 0;
  const definition = roomDefinitions[rx][ry];
  const lightPalette: Vector4[] = [[.3, .3, .3, 1]];
  const isSpecial = circuit == 9 && !rx && !ry;
  const entity = makeStaticEntity(
    MODEL_ID_FLOOR,
    x,
    y,
    1,
    COLLISION_TYPE_NONE,
    alternateAngle,
    lightPalette,
    1,
    isSpecial ? 4 : definition.depthZ || DEFAULT_DEPTH
  ) as LightEntity;

  entity.intelligence = INTELLIGENCE_ARTIFICIAL_LIGHT;
  const tanFOVDiv2 = isSpecial ? .4 : 3;
  entity.lightProjection = matrix4MultiplyStack([
    matrix4InfinitePerspective(tanFOVDiv2, 1, .1),
  ]);
  entity.lightTanFOVOn2 = tanFOVDiv2;
  entity.circuit = circuit;
  entity.flicker = 0;
  let i = 32;
  while (i) {
    i--;
    if (mathRandom()*i/32<.01) {
      entity.flicker = entity.flicker | (1 << i);
    }
  }

  addEntity(world, entity);

  if (isSpecial) {

    // also is the player starting point
    // const hairColors: Vector4[] = [
    //   [.1, .1, .2, 1],
    //   [.3, .3, .1, 1],
    //   [.4, .1, .1, 1],
    //   [.3, .3, .3, 1],
    //   [.2, .2, .1, 1],
    // ];
    // const mutedClothingColors: Vector4[] = [
    //   [.4, .4, .6, 1],
    //   [.5, .4, .4, 1],
    //   [.5, .5, .5, 1],
    //   [.3, .3, .3, 1],
    //   [.4, .5, .4, 1],
    // ];
    // const brightClothingColors: Vector4[] = [
    //   [.7, .5, .2, 1],
    //   [.7, .7, .1, 1],
    //   [.5, .7, .5, 1],
    //   [.7, .5, .5, 1],
    //   [.5, .5, .7, 1],
    //   [.4, .6, .6, 1],
    // ];
    const hairColors: Vector4[] = FLAG_RANDOM_PLAYER_COLORS
        ? new Array(5).fill(0).map(_=>convertHSLtoRGB(mathRandom(), mathRandom()/2, mathRandom()/2))
        : [
            [.1, .1, .2, 1],
            [.3, .3, .1, 1],
            //[.4, .1, .1, 1],
            [.3, .3, .3, 1],
            //[.2, .2, .1, 1],
        ];
    const mutedClothingColors: Vector4[] = FLAG_RANDOM_PLAYER_COLORS
        ? new Array(5).fill(0).map(_=>convertHSLtoRGB(mathRandom(), mathRandom()/5, mathRandom()/7+.1))
        : [
            [.4, .4, .6, 1],
            [.5, .4, .4, 1],
            //[.5, .5, .5, 1],
            [.3, .3, .3, 1],
            [.4, .5, .4, 1],
          ];
    const brightClothingColors: Vector4[] = FLAG_RANDOM_PLAYER_COLORS
        ? new Array(6).fill(0).map(_=> convertHSLtoRGB(mathRandom(), mathRandom()/2, mathRandom()/2+.2))
        : [
            [.7, .5, .2, 1],
            //[.7, .7, .1, 1],
            [.5, .7, .5, 1],
            //[.7, .5, .5, 1],
            [.5, .5, .7, 1],
            [.4, .6, .6, 1],
          ];
    const skinColors: Vector4[] = [
      [.7, .6, .6, 1],
      [.6, .5, .5, 1],
      [.5, .4, .3, 1],
    ];

    const mouthes: number[] = [
      4, // ⌓
      5, // ⌢
      6, // ⌣
      7, // ‿
      17, // -
      2, // •
    ];
    const eyes: number[] = [
      1, //°
      2, //•
      3, //ᵔ
      34 // >
    ];

    const skinColor = randomValueFromArray(skinColors);
    const hairColor = randomValueFromArray(hairColors.concat([skinColor]));
    const pantsColor = randomValueFromArray(mutedClothingColors);
    const shirtColor = randomValueFromArray(brightClothingColors.concat(mutedClothingColors).concat([skinColor]));
    const coatColor = randomValueFromArray(mutedClothingColors.concat(brightClothingColors).concat(new Array(5).fill(shirtColor)));
    const sleeveColor = randomValueFromArray([skinColor, skinColor, shirtColor, coatColor])
    const shoesColor = randomValueFromArray(mutedClothingColors);
    const pantLegColor = randomValueFromArray([pantsColor, skinColor]);
    const sockColor = randomValueFromArray(mutedClothingColors.concat([pantLegColor]).concat(brightClothingColors));
    const headbandColor = mathRandom() < .1 ? coatColor : randomValueFromArray([skinColor, hairColor]);
    const eye = randomValueFromArray(eyes);
    //const eye = 224;

    const player: Entity = {
      id: nextEntityId++,
      palette: [
        hairColor,
        skinColor,
        shoesColor,
        pantsColor,
        coatColor,
        shirtColor,
        sleeveColor,
        pantLegColor,
        sockColor,
        headbandColor,
        // [0, 0, 0, 0], // everything black, transparent
      ],
      body: HUMAN_BODY,
      pos: [x, y, 0],
      depthZ: 1.3,
      scaleZ: 1.1,
      collisionRadius: .2,
      renderRadius: 1,
      velocity: [0, 0, 0],
      collisionType: COLLISION_TYPE_DYNAMIC,
      badges: {
        [PART_ID_HEAD]: [
          // mouth
          [1, 0, -.8, randomValueFromArray(mouthes)],
          // left eye
          [-1, -mathPI/7, .7, eye],
          // right eye
          [1, mathPI/7, .7, eye],
        ],
        [PART_ID_TORSO]: [
          // // 4
          // [1, mathPI, 1, 3],
          // // 0
          // [1, mathPI*.8, 1, 7],
          // // 4
          // [1, -mathPI*.8, 1, 7]
          [mathRandom() > .5 ? 0 : 1 + mathRandom(), shirtColor==coatColor ? 0 : CONST_PI_1DP, 1, (34+mathRandom()*221)|0],
        ]
      },
      zRotation: CONST_PI_ON_2_1DP,
      intelligence: INTELLIGENCE_USER_CONTROLLED,
      animations:{
        [ACTION_WALK]: {
          frameDuration: 300,
          keyFrames: makeWalkCycle(1),
          repeating: 1,
          sound: STEP_SOUND,
          soundLoopDuration: 600,
        },
        [ACTION_RUN]: {
          frameDuration: 300,
          keyFrames: makeWalkCycle(2),
          repeating: 1,
          sound: RUN_SOUND,
          soundLoopDuration: 600,
        },
        [ACTION_ACTIVATE]: {
          frameDuration: 500,
          keyFrames: HUMAN_ACTIVATION_POSE,
          sound: SWITCH_SOUND,
        },
        [ACTION_CHOKING]: {
          frameDuration: 200,
          keyFrames: HUMAN_CHOKING_POSE,
          sound: CHOKING_SOUND
        },
        [ACTION_CROUCH]: {
          frameDuration: 300,
          keyFrames: HUMAN_CROUCH_POSE,
          repeating: 1,
        }
      },
      zPositionRange: [-.5, 0],
      //invisible: 1,
    };
    world.player = player;
    addEntity(world, player);
  }
}

const doorFactory = (world: World, x: number, y: number, alternateAngle: boolean | number, char: string) => {
  const rawCircuit = 122 - char.toLowerCase().charCodeAt(0);
  const circuit =  rawCircuit%CONST_DOOR_SWITCH_CUT_OFF; // z
  const reversed = (rawCircuit / CONST_DOOR_SWITCH_CUT_OFF) | 0;
  const doorColor = reversed ? COLOR_METAL_RED : COLOR_METAL_GREEN;
  const palette: Vector4[] = [
    doorColor,
    doorColor,
    COLOR_WHITE,
    FLAG_INVISIBLE_DOORS ? COLOR_TRANSLUCENT_DARK : COLOR_BLACK,
  ];
  const door = makeStaticEntity(MODEL_ID_DOOR, x, y, -1, COLLISION_TYPE_STATIC, alternateAngle, palette, 1) as DoorEntity;
  door.intelligence = INTELLIGENCE_ARTIFICIAL_DOOR;
  door.circuit = circuit;
  door.zPositionRange = [0, door.depthZ*.71];
  if (FLAG_INVISIBLE_DOORS) {
    door.invisible = 1;
  }
  door.reversed = reversed;
  const charIndex = circuitSymbols[circuit + (reversed)*5];
  door.badges = {
    0: [[.8, 0, -3.1, charIndex], [.8, CONST_PI_1DP, -3.1, charIndex]],
  };

  const wall = makeStaticEntity(MODEL_ID_LOW_WALL, x, y, 1, COLLISION_TYPE_STATIC, alternateAngle, [COLOR_OFF_WHITE], 1, door.depthZ);
  addEntity(world, wall);

  // add this second, very important, otherwise pathfinding will break
  world.alwaysUpdates.push(door);
  addEntity(world, door);
};

const globalFloorAndCeilingFactory = (world: World, x, y, alternateAngle, originalChar: string) => {
  if (originalChar != '#') {
    const definition = roomDefinitions[x/CONST_ROOM_DIMENSION | 0][y/CONST_ROOM_DIMENSION | 0];

    const floorPalette: Vector4[] = [
      COLOR_ROYAL_BLUE,
      COLOR_ROYAL_BLUE,
      COLOR_SKY_BLUE,
      COLOR_ROYAL_BLUE,
    ];
    const ceilingPalette: Vector4[] = [
      COLOR_METAL,
      COLOR_METAL,
      COLOR_OFFER_WHITE,
      COLOR_OFFER_WHITE,
    ];
    const lightIndex = parseInt(originalChar);
    const floor = makeStaticEntity(MODEL_ID_FLOOR, x, y, 1, COLLISION_TYPE_NONE, alternateAngle, floorPalette, 1);
    floor.pos[2] = -floor.depthZ;
    addEntity(world, floor);
    // only NaN will not equal itself
    if (lightIndex != lightIndex) {
      const ceiling = makeStaticEntity(MODEL_ID_FLOOR, x, y, 1, COLLISION_TYPE_NONE, alternateAngle, ceilingPalette, 1, definition.depthZ || DEFAULT_DEPTH)
      addEntity(world, ceiling);
    }
  }
};

const globalLegend: {[_: string]: RoomFeatureFactory} = {
  '#': (world, x, y, alternateAngle) => {
    const wallPalette: Vector4[] = [
      COLOR_OFF_WHITE,
      COLOR_OFF_WHITE,
      COLOR_WALL,
      //COLOR_OFF_WHITE,
    ];
    addEntity(world, makeStaticEntity(MODEL_ID_WALL, x, y, 1, COLLISION_TYPE_STATIC, alternateAngle, wallPalette))
  },
  '-': (world, x, y, alternateAngle) => {
    const wallPalette: Vector4[] = [
      COLOR_OFF_WHITE,
      COLOR_WHITE,
      COLOR_WALL,
      COLOR_WHITE,
    ];
    const entity = makeStaticEntity(MODEL_ID_WALL, x, y, 1, COLLISION_TYPE_STATIC, alternateAngle, wallPalette);
    if ((x | 0) == 23 && FLAG_SHOW_ALIEN_BADGE) {
      entity.badges = {
        // 👽⚠️
        0: [[2.2, 0, 4, 252], [2, 0, -1, 62]]
      };
    }
    addEntity(world, entity)
  },
  // 'q': (world, x, y, alternateAngle) => {
  //   addEntity(world, makeStaticEntity(MODEL_ID_BED, x, y, -1, COLLISION_TYPE_STATIC, alternateAngle));
  // },
  'l': (world, x, y, alternateAngle) => {
    const palette: Vector4[] = [
      COLOR_OFFEST_WHITE,
      COLOR_WOOD_LIGHT,
    ];
    addEntity(world, makeStaticEntity(MODEL_ID_TABLE, x, y, 1, COLLISION_TYPE_STATIC, alternateAngle, palette));
  },
  '+': (world, x, y, alternateAngle) => {
    const palette: Vector4[] = [
      COLOR_OFF_WHITE,
      COLOR_OFF_WHITE,
      COLOR_WALL,
    ];
    addEntity(world, makeStaticEntity(MODEL_ID_LOW_WALL, x, y, 1, COLLISION_TYPE_STATIC, alternateAngle, palette));
  },
  'm': (world, x, y, alternateAngle) => {
    const palette: Vector4[] = [
      COLOR_OFFEST_WHITE,
      COLOR_WOOD_LIGHT,
    ];
    addEntity(world, makeStaticEntity(MODEL_ID_CHAIR, x, y, .55, COLLISION_TYPE_STATIC, alternateAngle, palette, 1));
  },
  // 'n': (world, x, y, alternateAngle) => {
  //   const palette: Vector4[] = [
  //     COLOR_OFF_WHITE,
  //     COLOR_WOOD_LIGHT,
  //     COLOR_METAL,
  //     COLOR_WOOD_DARK
  //   ];
  //   addEntity(world, makeStaticEntity(MODEL_ID_CABINET_SHORT, x, y, .7, COLLISION_TYPE_STATIC, alternateAngle, palette));
  // },
  // 'm': (world, x, y, alternateAngle) => {
  //   const palette: Vector4[] = [
  //     COLOR_OFF_WHITE,
  //     COLOR_WOOD_LIGHT,
  //     COLOR_METAL,
  //     COLOR_WOOD_DARK
  //   ];
  //   addEntity(world, makeStaticEntity(MODEL_ID_CABINET_TALL, x, y, .7, COLLISION_TYPE_STATIC, alternateAngle, palette));
  // },
  'o': (world, x, y, alternateAngle) => {
    const wallPalette: Vector4[] = [
      COLOR_OFF_WHITE,
      COLOR_OFF_WHITE,
      COLOR_WALL,
    ];
    const lowerWall = makeStaticEntity(MODEL_ID_LOW_WALL, x, y, 1, COLLISION_TYPE_STATIC, alternateAngle, wallPalette);

    const windowPalette: Vector4[] = [
      COLOR_TRANSLUCENT_LIGHT
    ];
    const window = makeStaticEntity(MODEL_ID_WINDOW, x, y, -1, COLLISION_TYPE_STATIC, alternateAngle, windowPalette, 1, lowerWall.depthZ);
    window.invisible = -1;

    const upperWall = makeStaticEntity(MODEL_ID_LOW_WALL, x, y, 1, COLLISION_TYPE_STATIC, alternateAngle, [COLOR_OFF_WHITE], 1, window.depthZ + lowerWall.depthZ);

    addEntity(world, upperWall);
    addEntity(world, window);
    // NOTE: this must be last
    addEntity(world, lowerWall);
  },
  '!': (world, x, y) => {
    const rx = x/CONST_ROOM_DIMENSION | 0;
    const ry = y/CONST_ROOM_DIMENSION | 0;
    const definition = roomDefinitions[rx][ry];
    const room = world.rooms[rx][ry];
    room.cameraPosition = [x, y, (definition.depthZ || DEFAULT_DEPTH)-.2];
    // camera entity, not very useful
    // const palette: Vector4[] = [
    //   [.6, .6, .6, 1],
    //   [.3, .3, .3, 1],
    //   [.3, .3, .3, 1],
    //   [1, 0, 0, 1],
    // ];
    // const camera = makeStaticEntity(MODEL_ID_CAMERA, x, y, .3, COLLISION_TYPE_NONE, 0, palette, 1, (definition.depth || DEFAULT_DEPTH)-.1);
    // camera.intelligence = INTELLIGENCE_ARTIFICIAL_CAMERA;
    // addEntity(world, camera);
  },
  // '*': (room, x, y) => {
  //   const definition = roomDefinitions[x/ROOM_DIMENSION | 0][y/ROOM_DIMENSION | 0];
  //   const tanFOVDiv2 = Math.tan(mathPI/2.5);
  //   room.lightPosition = [x, y, (definition.depth || DEFAULT_DEPTH), 1];
  //   room.lightProjection = matrix4MultiplyStack([
  //     matrix4Perspective(tanFOVDiv2, 1, .1, 9),
  //   ]);
  //   room.lightTanFOVOn2 = tanFOVDiv2;
  // },
  '&': (world, x, y) => {
    const eye = 0;
    const entity: Entity = {
      id: nextEntityId++,
      palette: [
        [0, 0, 0, 0], // everything black, transparent
      ],
      body: HUMAN_BODY,
      pos: [x, y, 0],
      depthZ: 1.5,
      scaleZ: 1.2,
      collisionRadius: .2,
      renderRadius: 1,
      velocity: [0, 0, 0],
      collisionType: COLLISION_TYPE_DYNAMIC,
      zRotation: 0,
      anger: 0,
      intelligence: INTELLIGENCE_ARTIFICIAL_SHADOW_MONSTER,
      badges: {
        [PART_ID_HEAD]: [
          // left eye
          [-1, -CONST_PI_ON_7_2DP, .7, eye],
          // right eye
          [1, CONST_PI_ON_7_2DP, .7, eye],
        ],
      },
      animations:{
        [ACTION_WALK]: {
          frameDuration: 150,
          keyFrames: makeWalkCycle(.5),
          sound: MONSTER_SHUFFLE_SOUND,
          soundLoopDuration: 300,
        },
        [ACTION_RUN]: {
          frameDuration: 75,
          keyFrames: makeWalkCycle(.5),
          sound: MONSTER_SHUFFLE_SOUND,
          soundLoopDuration: 150,
        },
        [ACTION_ACTIVATE]: {
          frameDuration: 500,
          keyFrames: HUMAN_ACTIVATION_POSE,
          sound: SWITCH_SOUND,
        },
        [ACTION_CHOKER]: {
          frameDuration: 300,
          keyFrames: HUMAN_CHOKER_POSE,
          repeating: 1,
        }
      },
      invisible: 1,
    }
    entity.waitDuration = 0;
    world.monster = entity;
    world.alwaysUpdates.push(entity),
    addEntity(world, entity);
  },
  'a': switchFeatureFactory, // 0
  'b': switchFeatureFactory, // 1
  'c': switchFeatureFactory, // 2
  'd': switchFeatureFactory, // 3
  'e': switchFeatureFactory, // 4
  'f': switchFeatureFactory, // 5
  'g': switchFeatureFactory, // 6
  'h': switchFeatureFactory, // 7
  'i': switchFeatureFactory, // 8
  // 9 is always on
  // circuits 0-5
  'z': doorFactory, // 0
  'y': doorFactory, // 1
  'x': doorFactory, // 2
  'w': doorFactory, // 3
  'v': doorFactory, // 4
  //'u': doorFactory, // not 0
  't': doorFactory, // not 1
  's': doorFactory, // not 2
  'r': doorFactory, // not 3
  //'q': doorFactory, // not 4
  // circuits 5-9
  '1': lightFeatureFactory, // 1 - tied to a door closing
  '2': lightFeatureFactory, // 2 - tied to a door closing
  '5': lightFeatureFactory, // 5
  '6': lightFeatureFactory, // 6
  '7': lightFeatureFactory, // 7
  '8': lightFeatureFactory, // 8
  '9': lightFeatureFactory, // 9
};

const roomDefinitions: RoomDefinition[][] = [
  [
    // 0,0
    {
      //floorPalette: [COLOR_SKY_BLUE, COLOR_SKY_BLUE, COLOR_ROYAL_BLUE, COLOR_ROYAL_BLUE],
      adjoiningRooms: ADJOIN_EAST | ADJOIN_SOUTH,
      //ambientLight: .3,
      //depthZ: 4,
      layout:
        '  #      '+
        ' #9######'+
        '#__i+___#'+
        '#___+___Y'+
        '#___+8_B#'+
        '#___!___#'+
        '#______MO'+
        '#_____mLO'+
        '##oo#w####'
    },
    // 0,1
    {
      adjoiningRooms: ADJOIN_EAST | ADJOIN_NORTH,
      layout:
        '#M _d_i_#'+
        '#M______#'+
        '#M______O'+
        '#__!___G#'+
        '#+++8___S'+
        '#_______#'+
        '#_+#_____'+
        '#__#_____'+
        ' ########'
    }
  ],
  [
    // 1, 0
    {
      adjoiningRooms: ADJOIN_EAST | ADJOIN_SOUTH | ADJOIN_WEST | ADJOIN_SOUTH_WEST,
      layout:
        '#########'+
        '_!______#'+
        '________Z'+
        '________Z'+
        'H_______#'+
        '_7_#zooo#'+
        '___O___F#'+
        '___O_____'+
        '___######'
    },
    // 1,1
    {
      adjoiningRooms: ADJOIN_NORTH | ADJOIN_EAST | ADJOIN_WEST | ADJOIN_NORTH_WEST,
      layout:
        '___T_G###'+
        '___O_____'+
        '__6O_!___'+
        '___O_____'+
        '___O___E#'+
        '#ooooooo#'+
        '#______C#'+
        'Y_______V'+
        '#########'
    }
  ],
  [
    // 2, 0
    {
      adjoiningRooms: ADJOIN_WEST | ADJOIN_SOUTH,
      layout:
        '######## '+
        '__+___#9#'+
        '__+_+_O_#'+
        '__+5+_O_#'+
        '__!_+_O_#'+
        'M___+_R_#'+
        'oooooo###'+
        '______ # '+
        'm____+A#'
    },
    // 2, 1
    {
      depthZ: 4,
      adjoiningRooms: ADJOIN_WEST | ADJOIN_NORTH,
      layout:
        '####y####'+
        '__O_____#'+
        '__O_____#'+
        '__X_m_m_#'+
        '###Bl_l_#'+
        '__Z____!#'+
        '__O_+++_#'+
        '_&O__1__#'+
        '####---#'
    }
  ],

];