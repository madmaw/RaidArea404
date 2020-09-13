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
const MODEL_ID_LIGHT_SWITCH = 10;
const MODEL_ID_DOOR_SWITCH = 11;
const MODEL_ID_LOW_WALL = 12;
const MODEL_ID_DOOR = 13;
const MODEL_ID_WINDOW = 14;
const MODEL_ID_CABINET_SHORT = 15;
const MODEL_ID_CABINET_TALL = 16;
const MODEL_ID_BED = 17;

const WALL_WIDTH = 4;
const WALL_HEIGHT = 16;

const models: ModelDefinition[] = [
  // wall tile
  {
    //[FACE_TOP]: [0, 32, WALL_WIDTH, WALL_WIDTH],
    //[FACE_FRONT]: [27, 15, WALL_WIDTH, WALL_HEIGHT],
    [FACE_FRONT]: [24, 9, WALL_WIDTH, WALL_HEIGHT],
    [DIMENSION_DEPTH]: WALL_WIDTH,
  },
  // floor tile
  {
    [FACE_TOP]: [5, 7, 5, 5],
  },
  // chair
  {
    [FACE_LEFT]: [26, 0, 5, 9],
    [FACE_FRONT]: [0, 7, 5, 9],
    [FACE_BOTTOM]: [0, 7, 5, 5],
  },
  // table
  {
    [FACE_RIGHT]: [3, 0, 9, 7],
    [FACE_FRONT]: [3, 0, 9, 7],
  },
  // head
  {
    [FACE_FRONT]: [5, 19, 6, 8],
    [FACE_BACK]: [13, 13, 6, 8],
    [FACE_LEFT]: [18, 13, 6, 8],
    [FACE_TOP]: [13, 8, 6, 6],
    //[FACE_TOP]: [32, 8, 6, 6],
  },
  // torso
  {
    [FACE_FRONT]: [14, 0, 5, 8],
    [FACE_LEFT]: [23, 0, 3, 8],
    [FACE_BACK]: [18, 0, 5, 8],
    //[FACE_TOP]: [40, 9, 5, 3],
  },
  // upper arm
  {
    [FACE_RIGHT]: [11, 16, 3, 6],
    [FACE_FRONT]: [10, 7, 3, 6],
    [FACE_TOP]: [28, 0, 3, 3],
    [FACE_BOTTOM]: [6, 2, 3, 3],
    //[FACE_FRONT]: [53, 0, 3, 6],
    //[FACE_LEFT]: [56, 0, 3, 6],
    //[FACE_TOP]: [53, 6, 3, 3],
  },
  // forearm
  {
    [FACE_BACK]: [12, 0, 2, 6],
  },
  // thigh
  {
    [FACE_LEFT]: [5, 12, 2, 7],
    [FACE_FRONT]: [7, 12, 3, 7],
    [FACE_TOP]: [28, 0, 3, 3],
    // [FACE_LEFT]: [33, 15, 2, 7],
    // [FACE_FRONT]: [35, 15, 3, 7],
    //[FACE_TOP]: [32, 25, 3, 3],
  },
  // calf
  {
    [FACE_RIGHT]: [2, 16, 3, 7],
    [FACE_FRONT]: [0, 16, 2, 7],
  },
  // light switch
  {
    [FACE_FRONT]: [0, 3, 3, 4],
  },
  // door switch
  {
    [FACE_FRONT]: [0, 0, 3, 7],
  },
  // low wall
  {
    [FACE_FRONT]: [24, 20, WALL_WIDTH, 5],
    [DIMENSION_DEPTH]: WALL_WIDTH,
  },
  // door
  {
    [FACE_FRONT]: [24, 14, WALL_WIDTH, 11],
  },
  // window
  {
    [FACE_FRONT]: [24, 19, WALL_WIDTH, 6],
  },
  /*
  // short cabinet
  {
    [FACE_FRONT]: [27, 19, WALL_WIDTH, 6],
    [DIMENSION_DEPTH]: 4,
  },
  // tall cabinet
  {
    [FACE_FRONT]: [27, 16, WALL_WIDTH, 8],
    [DIMENSION_DEPTH]: 3,
  },
  // bed
  {
    [FACE_LEFT]: [16, 19, 8, 4],
    [FACE_FRONT]: [23, 19, 4, 4],
  },
  */

];