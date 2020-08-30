const ROOM_DIMENSION = 9;


type World = {
  rooms: Room[][],
  bounds: Vector2,
  age: number,
};

type Room = {
  entities: Entity[],
  cameraPosition: Vector3,
  lightPosition: Vector3 | undefined,
  lightProjection: Matrix4 | undefined,
}

const COLLISION_TYPE_STATIC = -1;
const COLLISION_TYPE_NONE = 0; // also can be undefined
const COLLISION_TYPE_DYNAMIC = 1;
const COLLISION_TYPE_SENSOR = 2;

const INTELLIGENCE_USER_CONTROLLED = 1;
const INTELLIGENCE_ARTIFICIAL_ZOMBIE = 2;

const ACTION_WALK = 1;

type CollisionType = -1 | 0 | 1 | 2;

type Entity = {
  id: number,
  position: Vector3,
  velocity: Vector3,
  radius: number,
  perimeter?: Vector2[] | 0,
  depth: number,
  zRotation: number,
  collisionType?: CollisionType,
  body: BodyPart,
  restitution?: number,
  bodyPartLastActiveRotation?: {[_: number]: LastActiveRotation},
  activeAnimations?: ActiveAnim[],
  animations?: {[_: number]: Anim },
  partTransforms?: {[_: number]: Matrix4},
  intelligence?: number,
};

type BodyPart = {
  attachmentPoint?: Vector3,
  attachmentTransform: Matrix4,
  id?: number,
  modelId: number,
  children?: BodyPart[],
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
  rotation: Vector3,
  lastAnimatedTime: number,
  lastAnimatedFrameDuration: number,
  lastAnimatedRotation: Vector3,
}

type Anim = {
  keyFrames: KeyFrame[],
  frameDuration: number,
  repeating?: boolean | number,
}

type ActiveAnim = {
  actionId: number,
  startTime: number,
  renewalTime?: number,
}