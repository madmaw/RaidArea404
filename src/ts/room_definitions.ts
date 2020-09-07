const DEFAULT_DEPTH = 2.5;

type RoomFeatureFactory = (room: Room, x: number, y: number, alternateAngle: boolean | number, originalChar: string) => void;

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
  const rx = cx / ROOM_DIMENSION | 0;
  const ry = cy / ROOM_DIMENSION | 0;

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
  const zRotation = alternateAngle
      ? cx - rx * ROOM_DIMENSION < ROOM_DIMENSION/2
            ? 0
            : Math.PI
      : cy - ry * ROOM_DIMENSION < ROOM_DIMENSION/2
            ? Math.PI/2
            : -Math.PI/2;

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

  }
}

const switchFeatureFactory = (room: Room, x: number, y: number, alternateAngle: boolean | number, char: string) => {
  const i = char.charCodeAt(0) - 65; // a
  const palette: Vector4[] = [
    [.7, .7, .7, 1],
    [0, 0, 0, 1],
    i%3 ? [0, 1, 0, 1] : [1, 0, 0, 1]
  ];
  const entity = makeStaticEntity(MODEL_ID_SWITCH, x, y, .05, COLLISION_TYPE_SENSOR, alternateAngle, palette, 0, 1.3);
  entity.intelligence = INTELLIGENCE_ARTIFICIAL_SWITCH;
  room.entities.push(entity);
}

const lightFeatureFactory = (room: Room, x: number, y: number, alternateAngle: boolean | number, char: string) => {
  const i = parseInt(char);
  const definition = roomDefinitions[x/ROOM_DIMENSION | 0][y/ROOM_DIMENSION | 0];
  const lightPalette: Vector4[] = [[.3, .3, .3, 1]];
  const entity = makeStaticEntity(MODEL_ID_FLOOR, x, y, 1, COLLISION_TYPE_NONE, alternateAngle, lightPalette, 1, (definition.depth || DEFAULT_DEPTH)+1/WALL_WIDTH);
  entity.intelligence = INTELLIGENCE_ARTIFICIAL_LIGHT;
  room.entities.push(entity);
}

const globalFloorAndCeilingFactory = (room: Room, x, y, alternateAngle, originalChar: string) => {
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
    const definition = roomDefinitions[x/ROOM_DIMENSION | 0][y/ROOM_DIMENSION | 0];
    room.entities.push(
      makeStaticEntity(MODEL_ID_FLOOR, x, y, 1, COLLISION_TYPE_NONE, alternateAngle, floorPalette, 1, -1/WALL_WIDTH),
    )
    if (Number.isNaN(lightIndex)) {
      room.entities.push(
        makeStaticEntity(MODEL_ID_FLOOR, x, y, 1, COLLISION_TYPE_NONE, alternateAngle, ceilingPalette, 1, (definition.depth || DEFAULT_DEPTH)+1/WALL_WIDTH)
      )
    }
  }
};

const globalLegend: {[_: string]: RoomFeatureFactory} = {
  '#': (room, x, y, alternateAngle) => {
    const wallPalette: Vector4[] = [
      [.6, .6, .6, 1],
      [.6, .6, .6, 1],
      [.3, .3, .5, 1],
      [.6, .6, .6, 1],
    ];
    room.entities.push(makeStaticEntity(MODEL_ID_WALL, x, y, 1, COLLISION_TYPE_STATIC, alternateAngle, wallPalette));
  },
  'q': (room, x, y, alternateAngle) => {
    room.entities.push(makeStaticEntity(MODEL_ID_BED, x, y, -1, COLLISION_TYPE_STATIC, alternateAngle));
  },
  't': (room, x, y, alternateAngle) => {
    room.entities.push(makeStaticEntity(MODEL_ID_TOILET, x, y, .6, COLLISION_TYPE_STATIC, alternateAngle));
  },
  'l': (room, x, y, alternateAngle) => {
    room.entities.push(makeStaticEntity(MODEL_ID_TABLE, x, y, 1, COLLISION_TYPE_STATIC, alternateAngle));
  },
  'r': (room, x, y, alternateAngle) => {
    const palette: Vector4[] = [
      [.4, .3, .2, 1],
    ];
    room.entities.push(makeStaticEntity(MODEL_ID_CHAIR, x, y, .55, COLLISION_TYPE_STATIC, alternateAngle, palette, 1));
  },
  '!': (room, x, y) => {
    const definition = roomDefinitions[x/ROOM_DIMENSION | 0][y/ROOM_DIMENSION | 0];
    room.cameraPosition = [x, y, (definition.depth || DEFAULT_DEPTH)-.2];
    const palette: Vector4[] = [
      [.6, .6, .6, 1],
      [.3, .3, .3, 1],
      [.3, .3, .3, 1],
      [1, 0, 0, 1],
    ];
    const camera = makeStaticEntity(MODEL_ID_CAMERA, x, y, .3, COLLISION_TYPE_NONE, 0, palette, 1, (definition.depth || DEFAULT_DEPTH)-.1);
    camera.intelligence = INTELLIGENCE_ARTIFICIAL_CAMERA;
    room.entities.push(camera)
  },
  '*': (room, x, y) => {
    const definition = roomDefinitions[x/ROOM_DIMENSION | 0][y/ROOM_DIMENSION | 0];
    const tanFOVDiv2 = Math.tan(Math.PI/2.5);
    room.lightPosition = [x, y, (definition.depth || DEFAULT_DEPTH), 1];
    room.lightProjection = matrix4MultiplyStack([
      matrix4Perspective(tanFOVDiv2, 1, .1, 9),
    ]);
    room.lightTanFOVOn2 = tanFOVDiv2;
  },
  'x': (room, x, y, alternateAngle) => {
    const shadowMonster: Entity = {
      id: nextEntityId++,
      palette: [
        [0, 0, 0, 0], // everything black, transparent
      ],
      body: humanBody,
      position: [x, y, 0],
      depth: 1.5,
      collisionRadius: .2,
      renderRadius: 1,
      velocity: [0, 0, 0],
      collisionType: COLLISION_TYPE_DYNAMIC,
      zRotation: 0,
      intelligence: INTELLIGENCE_ARTIFICIAL_SHADOW_MONSTER,
      animations:{
        [ACTION_WALK]: {
          frameDuration: 300,
          keyFrames: makeWalkCycle(1)
        }
      },
      invisible: 1,
    }
    room.entities.push(shadowMonster);
  },
  'a': switchFeatureFactory,
  'b': switchFeatureFactory,
  'c': switchFeatureFactory,
  'd': switchFeatureFactory,
  'e': switchFeatureFactory,
  'f': switchFeatureFactory,
  'g': switchFeatureFactory,
  'h': switchFeatureFactory,
  '0': lightFeatureFactory,
};

const worldBounds: Vector2 = [3, 2];

const roomDefinitions: RoomDefinition[][] = [
  [
    // 0,0
    {
      adjoiningRooms: ADJOIN_EAST,
      ambientLight: .1,
      layout:
        '  #######'+
        '  #Q____#'+
        '  #__*__#'+
        '  #C____#'+
        '  #______'+
        '  #T___1#'+
        '  #__x__#'+
        '  #Q!___#'+
        '#_#######'
    },
    // 0,1
    {
      layout:
        '#########'+
        '#_______#'+
        '#________'+
        '#_______#'+
        '#l_l*l_l#'+
        '#r_r_r_r#'+
        '#l_l_l_l#'+
        '#!_rar_r#'+
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
        '___x_*___'+
        '_________'+
        '___######'+
        '___#     '+
        '___#     '+
        '___#     '+
        '___#     '
    },
    // 1,1
    {
      adjoiningRooms: ADJOIN_NORTH | ADJOIN_EAST | ADJOIN_WEST | ADJOIN_NORTH_WEST,
      layout:
        '___######'+
        '____4____'+
        '__x___*__'+
        '__!______'+
        '#########'
    }
  ],
  [
    // 2, 0
    {
      adjoiningRooms: ADJOIN_WEST,
      layout:
        '#########'+
        '_______!#'+
        '_*___x__#'+
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
        '_____3#_#'+
        '_*___!__#'+
        '#_______#'+
        '#_______#'+
        '#_______#'+
        '#_______#'+
        '#########'
    }
  ],

];