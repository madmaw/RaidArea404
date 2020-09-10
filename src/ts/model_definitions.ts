///<reference path="./model.ts"/>

const MODEL_ID_WALL = 0;
const MODEL_ID_FLOOR = 1;
const MODEL_ID_CHAIR = 2;
const MODEL_ID_TABLE = 3;
const MODEL_ID_HEAD = 4;
const MODEL_ID_TORSO = 5;
const MODEL_ID_UPPER_ARM = 6;
const MODEL_ID_FOREARM = 7;
const MODEL_ID_THIGH = 8;
const MODEL_ID_CALF = 9;
const MODEL_ID_BED = 10;
const MODEL_ID_LIGHT_SWITCH = 11;
const MODEL_ID_DOOR_SWITCH = 12;
const MODEL_ID_LOW_WALL = 13;
const MODEL_ID_DOOR = 14;

const WALL_WIDTH = 5;
const WALL_HEIGHT = 15;

const BED_WIDTH = 12;
const BED_HEIGHT = 6;

const models: ModelDefinition[] = [
  // wall tile
  {
    //[FACE_TOP]: [0, 32, WALL_WIDTH, WALL_WIDTH],
    [FACE_FRONT]: [0, 37, WALL_WIDTH, WALL_HEIGHT],
    [DIMENSION_DEPTH]: WALL_WIDTH,
  },
  // floor tile
  {
    [FACE_TOP]: [0, 32, WALL_WIDTH, WALL_WIDTH],
  },
  // chair
  {
    [FACE_LEFT]: [0, 23, 5, 9],
    [FACE_FRONT]: [5, 23, 5, 9],
    [FACE_TOP]: [10, 23, 5, 5],
  },
  // table
  {
    [FACE_RIGHT]: [0, 15, 11, 8],
    [FACE_FRONT]: [11, 15, 13, 8],
  },
  // head 1
  {
    [FACE_FRONT]: [32, 0, 6, 8],
    [FACE_BACK]: [20, 0, 6, 8],
    [FACE_LEFT]: [26, 0, 6, 8],
    [FACE_TOP]: [26, 8, 6, 6],
    //[FACE_TOP]: [32, 8, 6, 6],
  },
  // torso
  {
    [FACE_FRONT]: [40, 0, 5, 8],
    [FACE_LEFT]: [45, 0, 3, 8],
    [FACE_BACK]: [48, 0, 5, 8],
    //[FACE_TOP]: [40, 9, 5, 3],
  },
  // upper arm
  {
    [FACE_FRONT]: [53, 0, 3, 6],
    [FACE_LEFT]: [56, 0, 3, 6],
    [FACE_TOP]: [53, 6, 3, 3],
  },
  // forearm
  {
    //[FACE_LEFT]: [61, 0, 1, 5],
    [FACE_FRONT]: [60, 0, 2, 6],
    // [FACE_TOP]: [53, 6, 3, 3],
  },
  // thigh
  {
    [FACE_LEFT]: [32, 15, 3, 7],
    [FACE_FRONT]: [35, 15, 3, 7],
    [FACE_TOP]: [32, 25, 3, 3],
  },
  // calf
  {
    [FACE_LEFT]: [42, 14, 3, 7],
    [FACE_FRONT]: [46, 14, 3, 7],
  },
  // bed
  {
    [FACE_LEFT]: [8, 37, BED_WIDTH, 5],
    [FACE_FRONT]: [19, 37, BED_HEIGHT, 5],
  },
  // light switch
  {
    [FACE_FRONT]: [34, 30, 3, 4],
  },
  // door switch
  {
    [FACE_FRONT]: [37, 24, 5, 10],
  },
  // low wall
  {
    [FACE_FRONT]: [0, 45, WALL_WIDTH, 6],
    [DIMENSION_DEPTH]: WALL_WIDTH,
  },
  // door
  {
    [FACE_FRONT]: [0, 37, WALL_WIDTH, 11],
  },
];