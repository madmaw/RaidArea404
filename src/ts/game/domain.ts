
type World = {
  rooms: Room[][],
  tiles: Tile[][],
  age: number,
  player?: PlayerEntity,
  monster?: MonsterEntity,
  switches: SwitchEntity[],
  alwaysUpdates: Entity[],
  activatedCircuits: {[_: number]: number },
};

const ADJOIN_NORTH = 1;
const ADJOIN_SOUTH = 2;
const ADJOIN_EAST = 4;
const ADJOIN_WEST = 8;
const ADJOIN_NORTH_EAST = 16;
const ADJOIN_NORTH_WEST = 32;
const ADJOIN_SOUTH_EAST = 64;
const ADJOIN_SOUTH_WEST = 128;

const CANONICAL_ADJOINS = [
  [0, -1], // north
  [0, 1], // south
  [1, 0], // east
  [-1, 0], // west
];
const ADJOINS = [
  ...CANONICAL_ADJOINS,
  [1, -1], // north east
  [-1, -1], // north west
  [1, 1], // south east
  [-1, 1], // south west
];

type Tile = {
  staticEntity?: Entity,
  lit: boolean | 0 | 1,
}


type Room = {
  entities: Entity[],
  cameraPosition?: Vector3,
  adjoiningRooms?: number,
  rx: number,
  ry: number,
}

const COLLISION_TYPE_STATIC = -1;
const COLLISION_TYPE_NONE = 0; // also can be undefined
const COLLISION_TYPE_DYNAMIC = 1;
const COLLISION_TYPE_SENSOR = 2;

const INTELLIGENCE_USER_CONTROLLED = 1;
const INTELLIGENCE_ARTIFICIAL_SHADOW_MONSTER = 2;
// const INTELLIGENCE_ARTIFICIAL_CAMERA = 3;
const INTELLIGENCE_ARTIFICIAL_LIGHT = 4;
const INTELLIGENCE_ARTIFICIAL_SWITCH = 5;
const INTELLIGENCE_ARTIFICIAL_DOOR = 6;

const ACTION_WALK = 1;
const ACTION_RUN = 2;
const ACTION_ACTIVATE = 3;
const ACTION_CROUCH = 4;
const ACTION_CHOKING = 5;
const ACTION_CHOKER = 6;

type CollisionType = -1 | 0 | 1 | 2;

type BaseEntity = {
  id: number,
  pos: Vector3,
  velocity: Vector3,
  scaleZ?: number,
  collisionRadius: number,
  renderRadius: number,
  palette: Vector4[],
  perimeter?: Vector2[] | 0,
  depthZ: number,
  zRotation: number,
  collisionType?: CollisionType,
  body: BodyPart,
  restitution?: number,
  bodyPartLastActiveRotation?: {[_: number]: LastActiveRotation},
  activeAnimations?: ActiveAnim[],
  animations?: {[_: number]: Anim },
  partTransforms?: {[_: number]: Matrix4},
  invisible?: 1 | 0 | -1, // -1 no shadow, 0 not invisible, 1 invisible with shadow
  badges?: {[_: number]: Vector4[] },
  lightProjection?: Matrix4 | undefined,
  lightTanFOVOn2?: number,
  lightIntensity?: number,
  zPositionRange?: Vector2,
  lastCollision?: number,
};

type InertEntity = {
  intelligence?: 0 | undefined // none
} & BaseEntity;

type PlayerEntity = {
  intelligence: 1, // user controlled
  lastChoked?: number,
  deadness?: number,
} & BaseEntity;

type MonsterEntity = {
  intelligence: 2, // monster
  steps?: Vector2[],
  anger: -1 | 0 | 1,
  waitDuration?: number,
  lastDetectedPlayer?: Vector3,
} & BaseEntity;

// type CameraEntity = {
//   intelligence: 3, // camera
// } & BaseEntity;

type LightEntity = {
  intelligence: 4, // light
  circuit?: number,
  flicker?: number,
  litAt?: number,
} & BaseEntity;

type SwitchEntity = {
  intelligence: 5, // switch
  circuit?: number,
} & BaseEntity;

type DoorEntity = {
  intelligence: 6, // door
  circuit?: number,
  // close when open
  reversed?: boolean | number,
} & BaseEntity;

type Entity = InertEntity | PlayerEntity | MonsterEntity | LightEntity | SwitchEntity | DoorEntity;

type BodyPart = {
  attachmentPoint?: Vector3,
  attachmentTransform: Matrix4,
  id?: number,
  modelId: number,
  childParts?: BodyPart[],
  paletteIndices?: number[],
  flipY?: boolean | number,
}

type Geometry = {
  vertexBuffer: WebGLBuffer,
  indexBuffer: WebGLBuffer,
  textureCoordinatesBuffer: WebGLBuffer,
  surfaceNormalBuffer: WebGLBuffer,
  indexCount: number,
  // all models are centered, so we only need the dimensions in each direction
  halfBounds: Vector3,
};

// part id to x, y, z rotations
type KeyFrame = {[_: number]: Vector3};

type LastActiveRotation = {
  actionId: number,
  originRotation: Vector3,
  angles: Vector3,
  lastAnimatedTime: number,
  lastAnimatedFrameDuration: number,
  lastAnimatedRotation: Vector3,
}

type Anim = {
  keyFrames: KeyFrame[],
  frameDuration: number,
  repeating?: boolean | number,
  sound?: SoundEffect3D,
  soundLoopDuration?: number,
}

type ActiveAnim = {
  actionId: number,
  startWorldAge: number,
  renewalWorldAge?: number,
  onComplete?: () => void,
}
