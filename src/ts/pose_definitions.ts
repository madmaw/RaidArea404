const PART_ID_TORSO = 10;
const PART_ID_HEAD = 11;
const PART_ID_LEFT_UPPER_ARM = 1;
const PART_ID_LEFT_LOWER_ARM = 2;
const PART_ID_RIGHT_UPPER_ARM = -1;
const PART_ID_RIGHT_LOWER_ARM = -2;
const PART_ID_LEFT_UPPER_LEG = 3;
const PART_ID_LEFT_LOWER_LEG = 4;
const PART_ID_RIGHT_UPPER_LEG = -3;
const PART_ID_RIGHT_LOWER_LEG = -4;

function reversePose(pose: KeyFrame) {
  const result: KeyFrame = {};
  for (let partId in pose) {
    const multiplier = Math.abs(partId as any) < 9
        ? -1
        : 1;
    const oppositePartId = multiplier * (partId as any);
    result[oppositePartId] = pose[partId].map(v => -multiplier * v) as Vector3;
  }
  return result;
}

function makeWalkCycle(scale: number) {
  const walk1: KeyFrame = {
    [PART_ID_LEFT_UPPER_LEG]: [0, Math.PI/15 * scale, 0],
    [PART_ID_LEFT_LOWER_LEG]: [Math.PI/6 * scale, 0, 0],
    [PART_ID_RIGHT_UPPER_LEG]: [0, -Math.PI/9 * scale, -Math.PI/24],
    [PART_ID_TORSO]: [0, Math.PI/60 * scale * scale, -Math.PI/24 * scale],
    [PART_ID_HEAD]: [0, 0, Math.PI/30 * scale],
    [PART_ID_LEFT_LOWER_ARM]: [Math.PI/15 * scale * scale, 0, 0],
    [PART_ID_RIGHT_LOWER_ARM]: [Math.PI/20 * scale * scale, 0, 0],
  }
  // return to defaults
  const walk2: KeyFrame = {
    [PART_ID_LEFT_UPPER_LEG]: [0, -Math.PI/18 * scale, -Math.PI/24],
    [PART_ID_LEFT_LOWER_LEG]: [Math.PI/4 * scale, 0, 0],
    [PART_ID_TORSO]: [0, Math.PI/99 * scale, 0],
    [PART_ID_LEFT_UPPER_ARM]: [0, -Math.PI/6 * scale, 0],
    [PART_ID_LEFT_LOWER_ARM]: [Math.PI/9 * scale, 0, 0],
    [PART_ID_RIGHT_UPPER_ARM]: [0, Math.PI/12 * scale, 0],
    [PART_ID_RIGHT_LOWER_ARM]: [Math.PI/20 * scale * scale, 0, 0],
  };
  const walk3 = reversePose(walk1);
  const walk4 = reversePose(walk2);
  walk3[PART_ID_TORSO][1] = walk1[PART_ID_TORSO][1];
  walk4[PART_ID_TORSO][1] = walk2[PART_ID_TORSO][1];
  return [walk1, walk2, walk3, walk4];
  //return [walk1, walk3];
}
