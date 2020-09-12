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
    [PART_ID_LEFT_UPPER_LEG]: [0, CONST_PI_ON_15_2DP * scale, 0],
    [PART_ID_LEFT_LOWER_LEG]: [CONST_PI_ON_6_1DP * scale, 0, 0],
    [PART_ID_RIGHT_UPPER_LEG]: [0, -CONST_PI_ON_9_1DP * scale, -CONST_PI_ON_24_2DP],
    [PART_ID_TORSO]: [0, CONST_PI_ON_60_2DP * scale * scale, -CONST_PI_ON_24_2DP * scale],
    [PART_ID_HEAD]: [0, 0, CONST_PI_ON_30_2DP * scale],
    [PART_ID_LEFT_LOWER_ARM]: [CONST_PI_ON_15_2DP * scale * scale, 0, 0],
    [PART_ID_RIGHT_LOWER_ARM]: [CONST_PI_ON_20_2DP * scale * scale, 0, 0],
  }
  // return to defaults
  const walk2: KeyFrame = {
    [PART_ID_LEFT_UPPER_LEG]: [0, -CONST_PI_ON_18_2DP * scale, -CONST_PI_ON_24_2DP],
    [PART_ID_LEFT_LOWER_LEG]: [CONST_PI_ON_4_1DP * scale, 0, 0],
    [PART_ID_TORSO]: [0, CONST_PI_ON_100_2DP * scale, 0],
    [PART_ID_LEFT_UPPER_ARM]: [0, -CONST_PI_ON_6_1DP * scale, 0],
    [PART_ID_LEFT_LOWER_ARM]: [CONST_PI_ON_9_1DP * scale, 0, 0],
    [PART_ID_RIGHT_UPPER_ARM]: [0, CONST_PI_ON_12_2DP * scale, 0],
    [PART_ID_RIGHT_LOWER_ARM]: [CONST_PI_ON_20_2DP * scale * scale, 0, 0],
  };
  const walk3 = reversePose(walk1);
  const walk4 = reversePose(walk2);
  walk3[PART_ID_TORSO][1] = walk1[PART_ID_TORSO][1];
  walk4[PART_ID_TORSO][1] = walk2[PART_ID_TORSO][1];
  return [walk2, walk3, walk4, walk1];
}

const HUMAN_ACTIVATION_POSE: KeyFrame[] = [
  // {
  //   [PART_ID_LEFT_UPPER_ARM]: [0, -CONST_PI_ON_2_1DP, 0],
  //   [PART_ID_LEFT_LOWER_ARM]: [CONST_PI_ON_5_1DP, 0, 0],
  //   [PART_ID_TORSO]: [0, CONST_PI_ON_9_1DP, 0],
  //   [PART_ID_HEAD]: [0, -CONST_PI_ON_9_1DP, 0],
  //   [PART_ID_LEFT_UPPER_LEG]: [0, -CONST_PI_ON_9_1DP, -CONST_PI_ON_24_2DP],
  //   [PART_ID_LEFT_LOWER_LEG]: [CONST_PI_ON_4_1DP, 0, 0],
  //   [PART_ID_RIGHT_UPPER_LEG]: [0, -CONST_PI_ON_3_1DP, -CONST_PI_ON_24_2DP],
  //   [PART_ID_RIGHT_LOWER_LEG]: [CONST_PI_ON_4_1DP, 0, 0],
  // },
  {
    [PART_ID_LEFT_UPPER_ARM]: [0, -CONST_PI_ON_2_1DP, 0],
    [PART_ID_LEFT_LOWER_ARM]: [CONST_PI_ON_8_1DP, 0, 0],
    [PART_ID_TORSO]: [0, CONST_PI_ON_9_1DP, 0],
    [PART_ID_HEAD]: [0, -CONST_PI_ON_9_1DP, 0],
    [PART_ID_LEFT_UPPER_LEG]: [0, -CONST_PI_ON_9_1DP, -CONST_PI_ON_24_2DP],
    [PART_ID_LEFT_LOWER_LEG]: [CONST_PI_ON_4_1DP, 0, 0],
    [PART_ID_RIGHT_UPPER_LEG]: [0, -CONST_PI_ON_3_1DP, -CONST_PI_ON_24_2DP],
    [PART_ID_RIGHT_LOWER_LEG]: [CONST_PI_ON_4_1DP, 0, 0],
  },
];

const HUMAN_CROUCH_POSE: KeyFrame[] = [
  {
    [PART_ID_LEFT_UPPER_ARM]: [0, -CONST_PI_ON_8_1DP, 0],
    [PART_ID_TORSO]: [0, CONST_PI_ON_6_1DP, 0],
    [PART_ID_HEAD]: [0, -CONST_PI_ON_8_1DP, 0],
    [PART_ID_LEFT_UPPER_LEG]: [0, -CONST_PI_ON_1_5_1DP, 0],
    [PART_ID_LEFT_LOWER_LEG]: [CONST_PI_ON_1_6_1DP, 0, 0],
    [PART_ID_RIGHT_LOWER_LEG]: [CONST_PI_ON_1_6_1DP, 0, 0],
  }
];

const chokingKeyFrame1: KeyFrame = {
  [PART_ID_LEFT_UPPER_ARM]: [0, -CONST_PI_ON_2_1DP, 0],
  [PART_ID_LEFT_LOWER_ARM]: [CONST_PI_ON_1_5_1DP, CONST_PI_ON_4_1DP, 0],
  [PART_ID_RIGHT_UPPER_ARM]: [0, -CONST_PI_ON_1_5_1DP, 0],
  [PART_ID_RIGHT_LOWER_ARM]: [CONST_PI_ON_1_5_1DP, CONST_PI_ON_6_1DP, 0],
  [PART_ID_HEAD]: [CONST_PI_ON_9_1DP, 0, 0],
  [PART_ID_RIGHT_LOWER_LEG]: [CONST_PI_ON_3_1DP, 0, 0],
  [PART_ID_LEFT_LOWER_LEG]: [CONST_PI_ON_4_1DP, 0, 0],

};
const HUMAN_CHOKING_POSE: KeyFrame[] = [
  chokingKeyFrame1,
  reversePose(chokingKeyFrame1),
];

const chokerKeyFrame1: KeyFrame = {
  [PART_ID_LEFT_UPPER_ARM]: [-CONST_PI_ON_9_1DP, -CONST_PI_ON_2_5_1DP, 0],
  [PART_ID_LEFT_LOWER_ARM]: [CONST_PI_ON_6_1DP, CONST_PI_ON_9_1DP, CONST_PI_ON_9_1DP],
  [PART_ID_RIGHT_UPPER_ARM]: [-CONST_PI_ON_4_1DP, -CONST_PI_ON_2_5_1DP, 0],
  [PART_ID_RIGHT_LOWER_ARM]: [CONST_PI_ON_5_1DP, CONST_PI_ON_9_1DP, CONST_PI_ON_9_1DP],
  // [PART_ID_LEFT_UPPER_LEG]: [Math.PI/20, Math.PI/20, 0],
  // [PART_ID_RIGHT_UPPER_LEG]: [Math.PI/20, -Math.PI/20, 0],
  // [PART_ID_RIGHT_LOWER_LEG]: [-Math.PI/20, 0, 0],
  // [PART_ID_LEFT_LOWER_LEG]: [Math.PI/9, 0, 0],

};
const HUMAN_CHOKER_POSE: KeyFrame[] = [
  chokerKeyFrame1,
];
