const DEFAULT_DEPTH = 2.5;

type RoomFeatureFactory = (world: World, x: number, y: number, alternateAngle: boolean | number, originalChar: string) => void;

type RoomDefinition = {
  depth?: number,
  ambientLight?: number,
  floorAndCeilingFactory?: RoomFeatureFactory,
  legend?: {[_:string]: RoomFeatureFactory}
  layout: string,
  adjoiningRooms?: number,
};

// GLOBALS!!!
let modelPerimeters: PerimeterPoint[][][];
let mainProgramInputs: MainProgramInputs;
const STEP_SOUND = lazySoundEffect((audioContext) => webAudioBoomSoundEffectFactory(audioContext, .05, .02, 2e3, .06, .03));
const RUN_SOUND = lazySoundEffect((audioContext) => webAudioBoomSoundEffectFactory(audioContext, .05, .01, 1e3, .2, .1));
const MONSTER_SHUFFLE_SOUND = lazySoundEffect((audioContext) => webAudioBoomSoundEffectFactory(audioContext, .03, .02, 799, .2, .1));
const CHOKING_SOUND = lazySoundEffect((audioContext) => webAudioBoomSoundEffectFactory(audioContext, .5, .2, 499, .1, .05));
const SWITCH_SOUND = lazySoundEffect((audioContext) => webAudioBoomSoundEffectFactory(audioContext, .02, 0, 3e3, .2, .1));

let nextEntityId = 10;
function makeStaticEntity(
  modelId: number,
  cx: number,
  cy: number,
  dimension: number,
  collisionType: CollisionType,
  alternateAngle: boolean | number,
  palette?: Vector4[],
  centered?: 0 | 1,
  z?: number
): Entity {
  palette = palette || new Array(4).fill(0).map((_, i) => new Array(3).fill(i/3).concat(1) as Vector4);
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
          ? Math.PI
          : 0
      : belowChar == '#' || lry == CONST_ROOM_DIMENSION-1 || aboveChar != '#' && lry > CONST_ROOM_DIMENSION/2
          ? -Math.PI/2
          : Math.PI/2;

  const halfBounds = mainProgramInputs.modelBuffers[modelId].halfBounds;
  const scale = Math.abs(dimension)*.5/halfBounds[dimension>0 ? 0 : 1];
  const perimeter = collisionType < 0 // static collision
      ? getPerimeter(models[modelId], modelPerimeters[modelId], FACE_TOP)
          .map(p => {
            const position = [...p.position] as Vector2;
            // up is down
            position[1] *= -1;
            return vector2Rotate(Math.PI/2, position);
          })
          .map(p => p.map(v => v * scale) as Vector2)
      : 0;
  // const zRotation = alternateAngle
  //     ? cx - rx * ROOM_DIMENSION < ROOM_DIMENSION/2
  //           ? 0
  //           : Math.PI
  //     : cy - ry * ROOM_DIMENSION < ROOM_DIMENSION/2
  //           ? Math.PI/2
  //           : -Math.PI/2;

  const dimensions = halfBounds.map(d => d * scale) as Vector3;
  const rotatedDimensions = vector2Rotate(-zRotation, dimensions);
  const rotatedPosition = vector2Rotate(-zRotation, [cx, cy, z || 0]);
  rotatedPosition[0] -= .5-Math.abs(rotatedDimensions[0]);
  const position: Vector3 = centered
    ? [cx, cy, z || 0]
    : vector2Rotate(zRotation, rotatedPosition) as Vector3;

  const collisionRadiusAdjust = collisionType == COLLISION_TYPE_DYNAMIC
      ? .7
      : 1;
  return {
    id: nextEntityId++,
    depth: halfBounds[2] * 2 * scale,
    position,
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
      ? makeStaticEntity(MODEL_ID_DOOR_SWITCH, x, y, .05, COLLISION_TYPE_SENSOR, alternateAngle, palette, 0, 1.3) as SwitchEntity
      : makeStaticEntity(MODEL_ID_LIGHT_SWITCH, x, y, .05, COLLISION_TYPE_SENSOR, alternateAngle, palette, 0, 1.3) as SwitchEntity;
  entity.collisionRadius = .7;
  entity.intelligence = INTELLIGENCE_ARTIFICIAL_SWITCH;
  entity.circuit = circuit;
  if (doorSwitch) {
    entity.badges = {
      0: [[2, 0, 2, circuit + 4]],
    };
  }
  world.switches.push(entity);
  addEntity(world, entity);
}

const lightFeatureFactory = (world: World, x: number, y: number, alternateAngle: boolean | number, char: string) => {
  const circuit = parseInt(char);
  const definition = roomDefinitions[x/CONST_ROOM_DIMENSION | 0][y/CONST_ROOM_DIMENSION | 0];
  const lightPalette: Vector4[] = [[.3, .3, .3, 1]];
  const entity = makeStaticEntity(
    MODEL_ID_FLOOR,
    x,
    y,
    1,
    COLLISION_TYPE_NONE,
    alternateAngle,
    lightPalette,
    1,
    (definition.depth || DEFAULT_DEPTH)+1/WALL_WIDTH
  ) as LightEntity;
  entity.intelligence = INTELLIGENCE_ARTIFICIAL_LIGHT;
  const tanFOVDiv2 = Math.tan(Math.PI/2.5);
  entity.lightProjection = matrix4MultiplyStack([
    matrix4Perspective(tanFOVDiv2, 1, .1, 9),
  ]);
  entity.lightTanFOVOn2 = tanFOVDiv2;
  entity.circuit = circuit;
  entity.flicker = 0;
  let i = 32;
  while (i) {
    i--;
    if (Math.random()*i/32<(9-circuit)/99) {
      entity.flicker = entity.flicker | (1 << i);
    }
  }

  addEntity(world, entity);
}

const doorFactory = (world: World, x: number, y: number, alternateAngle: boolean | number, char: string) => {
  const circuit =  122 - char.toLowerCase().charCodeAt(0); // z
  const palette: Vector4[] = [
    COLOR_WALL,
    COLOR_WALL,
    COLOR_OFF_WHITE,
    COLOR_TRANSLUCENT,
  ];
  const door = makeStaticEntity(MODEL_ID_DOOR, x, y, -1, COLLISION_TYPE_STATIC, alternateAngle, palette, 1) as DoorEntity;
  door.intelligence = INTELLIGENCE_ARTIFICIAL_DOOR;
  door.circuit = circuit;
  door.zPositionRange = [0, door.depth*.9];
  door.invisible = 1;

  const wall = makeStaticEntity(MODEL_ID_LOW_WALL, x, y, 1, COLLISION_TYPE_STATIC, alternateAngle, [COLOR_OFF_WHITE], 1, door.depth);
  wall.badges = {
    0: [[.8, 0, -1.7, circuit + 4], [.8, Math.PI, -1.7, circuit + 4]],
  };
  addEntity(world, wall);

  // add this second, very important, otherwise pathfinding will break
  addEntity(world, door);
};

const globalFloorAndCeilingFactory = (world: World, x, y, alternateAngle, originalChar: string) => {
  if (originalChar != '#') {
    const floorPalette: Vector4[] = [
      [.1, .1, .2, 1],
      [.1, .1, .2, 1],
      [.3, .3, .5, 1],
      [.1, .1, .2, 1],
    ];
    const ceilingPalette: Vector4[] = [
      [0.6, 0.6, 0.6, 1],
      [0.6, 0.6, 0.6, 1],
      [0.4, 0.4, 0.4, 1],
      [0.4, 0.4, 0.4, 1],
    ];
    const lightIndex = parseInt(originalChar);
    addEntity(world, makeStaticEntity(MODEL_ID_FLOOR, x, y, 1, COLLISION_TYPE_NONE, alternateAngle, floorPalette, 1, -1/WALL_WIDTH));
    if (Number.isNaN(lightIndex)) {
      const definition = roomDefinitions[x/CONST_ROOM_DIMENSION | 0][y/CONST_ROOM_DIMENSION | 0];
      addEntity(
        world,
        makeStaticEntity(MODEL_ID_FLOOR, x, y, 1, COLLISION_TYPE_NONE, alternateAngle, ceilingPalette, 1, (definition.depth || DEFAULT_DEPTH)+1/WALL_WIDTH)
      );
    }
  }
};

const globalLegend: {[_: string]: RoomFeatureFactory} = {
  '#': (world, x, y, alternateAngle) => {
    const wallPalette: Vector4[] = [
      COLOR_OFF_WHITE,
      COLOR_OFF_WHITE,
      COLOR_WALL,
      COLOR_OFF_WHITE,
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
    if (x == 4) {
      entity.badges = {
        0: [[1, Math.PI/2, 2, 12], [1, -Math.PI/2, 2, 12]]
      };
    }
    addEntity(world, entity)
  },
  'q': (world, x, y, alternateAngle) => {
    addEntity(world, makeStaticEntity(MODEL_ID_BED, x, y, -1, COLLISION_TYPE_STATIC, alternateAngle));
  },
  'l': (world, x, y, alternateAngle) => {
    const palette: Vector4[] = [
      COLOR_OFF_WHITE,
      COLOR_WOOD_LIGHT,
    ];
    addEntity(world, makeStaticEntity(MODEL_ID_TABLE, x, y, 1, COLLISION_TYPE_STATIC, alternateAngle, palette));
  },
  '+': (world, x, y, alternateAngle) => {
    const palette: Vector4[] = [
      COLOR_OFF_WHITE,
      COLOR_WOOD_DARK
    ];
    addEntity(world, makeStaticEntity(MODEL_ID_LOW_WALL, x, y, 1, COLLISION_TYPE_STATIC, alternateAngle, palette));
  },
  'r': (world, x, y, alternateAngle) => {
    const palette: Vector4[] = [
      COLOR_OFF_WHITE,
      COLOR_WOOD_LIGHT,
    ];
    addEntity(world, makeStaticEntity(MODEL_ID_CHAIR, x, y, .55, COLLISION_TYPE_STATIC, alternateAngle, palette, 1));
  },
  '!': (world, x, y) => {
    const rx = x/CONST_ROOM_DIMENSION | 0;
    const ry = y/CONST_ROOM_DIMENSION | 0;
    const definition = roomDefinitions[rx][ry];
    const room = world.rooms[rx][ry];
    room.cameraPosition = [x, y, (definition.depth || DEFAULT_DEPTH)-.2];
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
  //   const tanFOVDiv2 = Math.tan(Math.PI/2.5);
  //   room.lightPosition = [x, y, (definition.depth || DEFAULT_DEPTH), 1];
  //   room.lightProjection = matrix4MultiplyStack([
  //     matrix4Perspective(tanFOVDiv2, 1, .1, 9),
  //   ]);
  //   room.lightTanFOVOn2 = tanFOVDiv2;
  // },
  '&': (world, x, y) => {
    const eye = 224;
    const entity: Entity = {
      id: nextEntityId++,
      palette: [
        [0, 0, 0, 0], // everything black, transparent
      ],
      body: HUMAN_BODY,
      position: [x, y, 0],
      depth: 1.5,
      scaleZ: 1.2,
      collisionRadius: .2,
      renderRadius: 1,
      velocity: [0, 0, 0],
      collisionType: COLLISION_TYPE_DYNAMIC,
      zRotation: 0,
      intelligence: INTELLIGENCE_ARTIFICIAL_SHADOW_MONSTER,
      badges: {
        [PART_ID_HEAD]: [
          // left eye
          [-1, -Math.PI/7, .7, eye],
          // right eye
          [1, Math.PI/7, .7, eye],
        ],
      },
      animations:{
        [ACTION_WALK]: {
          frameDuration: 150,
          keyFrames: makeWalkCycle(.5),
          sound: MONSTER_SHUFFLE_SOUND,
          soundLoopTime: 300,
        },
        [ACTION_RUN]: {
          frameDuration: 75,
          keyFrames: makeWalkCycle(.5),
          sound: MONSTER_SHUFFLE_SOUND,
          soundLoopTime: 150,
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
    addEntity(world, entity);
  },
  '@': (world, x, y) => {
    const hairColors: Vector4[] = [
      [.1, .1, .2, 1],
      [.3, .3, .1, 1],
      [.4, .1, .1, 1],
      [.3, .3, .3, 1],
      [.2, .2, .1, 1],
    ];
    const mutedClothingColors: Vector4[] = [
      [.4, .4, .6, 1],
      [.5, .4, .4, 1],
      [.5, .5, .5, 1],
      [.3, .3, .3, 1],
      [.4, .5, .4, 1],
    ];
    const brightClothingColors: Vector4[] = [
      [.7, .5, .2, 1],
      [.7, .7, .1, 1],
      [.5, .7, .5, 1],
      [.7, .5, .5, 1],
      [.5, .5, .7, 1],
      [.4, .6, .6, 1],
    ];
    const skinColors: Vector4[] = [
      [.7, .6, .6, 1],
      [.6, .6, .6, 1],
      [.6, .5, .5, 1],
      [.5, .4, .3, 1],
    ];

    const mouthes: number[] = [
      2,
      47,
      48,
      49,
      50,
    ];
    const eyes: number[] = [
      51,
      52,
      53
    ];

    const skinColor = randomValueFromArray(skinColors);
    const hairColor = randomValueFromArray([...hairColors, skinColor]);
    const pantsColor = randomValueFromArray(mutedClothingColors);
    const shirtColor = randomValueFromArray([...brightClothingColors, ...mutedClothingColors, skinColor]);
    const coatColor = randomValueFromArray([...mutedClothingColors, ...brightClothingColors, shirtColor]);
    const sleeveColor = randomValueFromArray([skinColor, shirtColor, coatColor])
    const shoesColor = randomValueFromArray(mutedClothingColors);
    const pantLegColor = randomValueFromArray([pantsColor, skinColor]);
    const sockColor = randomValueFromArray([pantLegColor, ...mutedClothingColors, ...brightClothingColors]);
    const headbandColor = Math.random() < .1 ? coatColor : randomValueFromArray([skinColor, hairColor]);
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
      position: [x, y, 0],
      depth: 1.3,
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
          [-1, -Math.PI/7, .7, eye],
          // right eye
          [1, Math.PI/7, .7, eye],
        ],
        [PART_ID_TORSO]: [
          // // 4
          // [1, Math.PI, 1, 3],
          // // 0
          // [1, Math.PI*.8, 1, 7],
          // // 4
          // [1, -Math.PI*.8, 1, 7]
          [Math.random() > .5 ? 0 : 1 + Math.random(), shirtColor==coatColor ? 0 : Math.PI, 1, 51+Math.random()*169|0],
        ]
      },
      zRotation: 0,
      intelligence: INTELLIGENCE_USER_CONTROLLED,
      animations:{
        [ACTION_WALK]: {
          frameDuration: 300,
          keyFrames: makeWalkCycle(1),
          repeating: 1,
          sound: STEP_SOUND,
          soundLoopTime: 600,
        },
        [ACTION_RUN]: {
          frameDuration: 300,
          keyFrames: makeWalkCycle(2),
          repeating: 1,
          sound: RUN_SOUND,
          soundLoopTime: 600,
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
  },
  'a': switchFeatureFactory,
  'b': switchFeatureFactory,
  'c': switchFeatureFactory,
  'd': switchFeatureFactory,
  'e': switchFeatureFactory,
  'f': switchFeatureFactory,
  'g': switchFeatureFactory,
  'h': switchFeatureFactory,
  'i': switchFeatureFactory,
  'z': doorFactory,
  'y': doorFactory,
  'x': doorFactory,
  'w': doorFactory,
  '0': lightFeatureFactory,
  '1': lightFeatureFactory,
  '2': lightFeatureFactory,
  '3': lightFeatureFactory,
  '4': lightFeatureFactory,
  '5': lightFeatureFactory,
  '6': lightFeatureFactory,
  '7': lightFeatureFactory,
  '8': lightFeatureFactory,
  '9': lightFeatureFactory,
};

const roomDefinitions: RoomDefinition[][] = [
  [
    // 0,0
    {
      depth: 2.8,
      adjoiningRooms: ADJOIN_EAST,
      ambientLight: 0,
      layout:
        '  #######'+
        '  #Q_@__#'+
        '  #_____#'+
        '  #_____#'+
        '  #&_9__Y'+
        '  #____B#'+
        '  #__l__#'+
        '  #Q!___#'+
        '  #######'
    },
    // 0,1
    {
      adjoiningRooms: ADJOIN_EAST,
      layout:
        '###---###'+
        '#___5___#'+
        '#__+++__#'+
        '#________'+
        '#l_l_l_l#'+
        '#r_r_r_r#'+
        '#l_l_l_l#'+
        '#!_rfr_r#'+
        '#########'
    }
  ],
  [
    // 1, 0
    {
      adjoiningRooms: ADJOIN_EAST | ADJOIN_SOUTH | ADJOIN_WEST,
      layout:
        '#########'+
        '!________'+
        '_1_______'+
        '___######'+
        '___#     '+
        '__B#     '+
        '___#     '+
        '___#     '+
        '___#     '
    },
    // 1,1
    {
      adjoiningRooms: ADJOIN_NORTH | ADJOIN_EAST | ADJOIN_WEST | ADJOIN_NORTH_WEST,
      layout:
        '___######'+
        '_________'+
        '_1_______'+
        '__!______'+
        '___######'+
        '___#     '+
        '___#     '+
        '___#     '+
        '####     '
    }
  ],
  [
    // 2, 0
    {
      adjoiningRooms: ADJOIN_WEST,
      layout:
        '#########'+
        '_______!#'+
        '________#'+
        '________#'+
        '#_______#'+
        '#_______#'+
        '#_______#'+
        '#___2___#'+
        '###_#####'
    },
    // 2, 1
    {
      adjoiningRooms: ADJOIN_WEST | ADJOIN_NORTH,
      layout:
        '###_#####'+
        '________#'+
        '___3_D#_#'+
        '_____!__#'+
        '#l______#'+
        '#_______#'+
        '#_______#'+
        '#_______#'+
        '#########'
    }
  ],

];