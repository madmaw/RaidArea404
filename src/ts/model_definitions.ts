const MODEL_ID_WALL = 0;
const MODEL_ID_CHAIR = 1;
const MODEL_ID_TABLE = 2;
const MODEL_ID_SPANNER = 3;
const MODEL_ID_HEAD = 4;
const MODEL_ID_TORSO = 5;
const MODEL_ID_UPPER_ARM = 6;
const MODEL_ID_FOREARM = 7;
const MODEL_ID_THIGH = 8;
const MODEL_ID_CALF = 9;

const WALL_WIDTH = 5;
const WALL_HEIGHT = 15;

const models: ModelDefinition[] = [
  // floor/wall tile
  {
    [FACE_TOP]: [0, 32, WALL_WIDTH, WALL_WIDTH],
    [FACE_FRONT]: [0, 37, WALL_WIDTH, WALL_HEIGHT],
  },
  // chair
  {
    [FACE_LEFT]: [0, 0, 6, 10],
    [FACE_FRONT]: [6, 0, 5, 10],
    [FACE_TOP]: [6, 10, 5, 6],
  },
  // table
  {
    [FACE_RIGHT]: [0, 16, 11, 7],
    [FACE_FRONT]: [11, 16, 13, 7],
  },

  // spanner
  {
    //[FACE_TOP]: [12, 1, 3, 3],
    [FACE_TOP]: [11, 0, 5, 16],
    //[FACE_RIGHT]:[16, 0, 1, 16],
    //[DIMENSION_DEPTH]: .6
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
    [FACE_TOP]: [40, 9, 5, 3],
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
  // head 2
  {
    [FACE_LEFT]: [24, 24, 5, 8],
    [FACE_FRONT]: [19, 24, 5, 8],
    [FACE_TOP]: [6, 10, 5, 6],
    [FACE_BACK]: [24, 16, 5, 8],
  },
  // pyramid
  {
    [FACE_LEFT]: [0, 23, 3, 2],
    [FACE_FRONT]: [3, 23, 3, 2],
  },
  // cu
  {
    [FACE_FRONT]: [0, 10, 3, 3],
    [FACE_RIGHT]: [3, 10, 3, 3],
    [FACE_BOTTOM]: [0, 13, 3, 3],
  },
  // tombstone
  {
    //[FACE_BOTTOM]: [0, 25, 3, 3],
    [FACE_LEFT]: [0, 26, 3, 3],
    [FACE_FRONT]: [3, 26, 3, 3],
    //[FACE_RIGHT]: [6, 25, 3, 4],
    //[FACE_BACK]: [9, 25, 3, 4],
    //[FACE_TOP]: [3, 29, 3, 3],
    [FACE_BOTTOM]: [6, 29, 3, 3],
  },
  // triangle
  {
    [FACE_TOP]: [16, 8, 8, 8],
    [DIMENSION_HEIGHT]: 4,
  },
  // crosses
  {
    //[FACE_FRONT]: [12, 25, 2, 2],
    [FACE_FRONT]: [0, 0, 2, 2],
    [FACE_BACK]: [1, 4, 2, 2],
    //[FACE_RIGHT]: [15, 25, 2, 2],
    //[FACE_TOP]: [12, 29, 3, 3],
    //[FACE_TOP]: [3, 29, 3, 3],
  },
  // legs
  {
    [FACE_RIGHT]: [13, 27, 4, 3],
    //[FACE_FRONT]: [13, 20, 1, 3],
    //[FACE_TOP]: [12, 29, 3, 3],
    //[FACE_TOP]: [3, 29, 3, 3],
  }
  // spiral
  /*
  {
    [FACE_TOP]: [16, 0, 14, 16],
    [DIMENSION_HEIGHT]: 5,
  }
  */
];