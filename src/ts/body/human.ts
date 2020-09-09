///<reference path="../model_definitions.ts"/>
///<reference path="../pose_definitions.ts"/>
///<reference path="../math/matrix.ts"/>
///<reference path="../math/vector.ts"/>

    // hairColor,   0
// skinColor,   1
// shoesColor,  2
// pantsColor,  3
// coatColor,   4
// shirtColor,  5
// sleeveColor, 6
// pantLegColor 7
// sockColor 8
// headband/visor, 9


const HUMAN_BODY: BodyPart = {
  id: PART_ID_TORSO,
  attachmentPoint: [0, 0, .85],
  paletteIndices: [5, 4, 3, 5],
  attachmentTransform: matrix4MultiplyStack([
    matrix4Scale(.08),
    matrix4Rotate(Math.PI/30, 0, 1, 0),
    matrix4Translate(0, 0, 3.5),
  ]),
  //badges: [[2, Math.PI, 1.5, 131]],
  // badges: [
  //   [1, Math.PI, 1, 3],
  //   [1, Math.PI*.8, 1, 7],
  //   [1, -Math.PI*.8, 1, 7]
  // ],
  modelId: MODEL_ID_TORSO,
  children: [
    {
      id: PART_ID_HEAD,
      modelId: MODEL_ID_HEAD,
      attachmentPoint: [-.2, 0, 4.2],
      paletteIndices: [0, 5, 1, 9],
      // badges: [
      //   // mouth
      //   [1, 0, -.8, 0],
      //   // left eye
      //   [-1, -Math.PI/7, 1.4, 1],
      //   // right eye
      //   [1, Math.PI/7, 1.4, 1],
      // ],
      attachmentTransform: matrix4MultiplyStack([
        matrix4Rotate(-Math.PI/30, 0, 1, 0),
        matrix4Scale(.5),
        matrix4Translate(0, 0, 3),
      ]),
    },
    {
      id: PART_ID_RIGHT_UPPER_ARM,
      modelId: MODEL_ID_UPPER_ARM,
      attachmentPoint: [0, 2.1, 2.8],
      paletteIndices: [4, 4, 6, 6],
      attachmentTransform: matrix4MultiplyStack([
        // matrix4Translate(0, 5, 1),
        // matrix4Rotate(0, 0, 1, Math.PI/2),
        //
        //matrix4Rotate(0, 1, 0, -Math.PI/5),
        //matrix4Rotate(1, 0, 0, -Math.PI/2),
        matrix4Scale(.8),
        matrix4Rotate(-Math.PI/50, 1, 0, 0),
        matrix4Rotate(Math.PI/20, 0, 1, 0),
        matrix4Translate(0, 0, -2),
        matrix4Rotate(-Math.PI/2, 0, 0, 1),
      ]),
      children: [
        {
          id: PART_ID_RIGHT_LOWER_ARM,
          modelId: MODEL_ID_FOREARM,
          attachmentPoint: [0, .5, -3],
          paletteIndices: [6, 1, 1],
          attachmentTransform: matrix4MultiplyStack([
            matrix4Rotate(Math.PI/6, 1, 0, 0),
            matrix4Rotate(Math.PI/9, 0, 0, 1),
            matrix4Translate(1, -.5, -2.8),
          ]),
        }
      ],
    },
    {
      id: PART_ID_LEFT_UPPER_ARM,
      modelId: MODEL_ID_UPPER_ARM,
      flipY: 1,
      attachmentPoint: [0, -2.1, 2.8],
      paletteIndices: [4, 4, 6, 6],
      attachmentTransform: matrix4MultiplyStack([
        // matrix4Translate(0, 5, 1),
         //matrix4Rotate(0, 1, 0, Math.PI/4),
        //
        //matrix4Rotate(1, 0, 0, Math.PI/5),
        matrix4Scale(.8),
        matrix4Rotate(-Math.PI/50, 1, 0, 0),
        matrix4Rotate(Math.PI/20, 0, 1, 0),
        matrix4Translate(0, 0, -2),
        //matrix4Rotate(0, 0, 1, Math.PI),
        matrix4Rotate(-Math.PI/2, 0, 0, 1),
      ]),
      children: [
        {
          id: PART_ID_LEFT_LOWER_ARM,
          modelId: MODEL_ID_FOREARM,
          attachmentPoint: [0, .5, -3],
          paletteIndices: [6, 1, 1],
          attachmentTransform: matrix4MultiplyStack([
            matrix4Rotate(Math.PI/6, 1, 0, 0),
            //matrix4Rotate(Math.PI/9, 0, 1, 0),
            matrix4Rotate(Math.PI/9, 0, 0, 1),
            matrix4Translate(1, -.5, -2.8),
          ]),
        }
      ],
    },
    // right thigh
    {
      id: PART_ID_RIGHT_UPPER_LEG,
      modelId: MODEL_ID_THIGH,
      attachmentPoint: [.4, -.2, -2],
      paletteIndices: [3, 3, 7],
      attachmentTransform: matrix4MultiplyStack([
        matrix4Rotate(Math.PI/20, 1, 0, 0),
        matrix4Rotate(-Math.PI/20, 0, 1, 0),
        matrix4Translate(-.5, 0, -3.7),
        matrix4Rotate(Math.PI * .55, 0, 0, 1),
      ]),
      children: [
        {
          id: PART_ID_RIGHT_LOWER_LEG,
          modelId: MODEL_ID_CALF,
          attachmentPoint: [0, 0, -3.5],
          paletteIndices: [7, 2, 8],
          attachmentTransform: matrix4MultiplyStack([
            matrix4Rotate(Math.PI/20, 0, 1, 0),
            matrix4Translate(0, 0, -2.3),
            matrix4Rotate(Math.PI/2, 0, 0, 1),
          ]),
        }
      ]
    },
    {
      id: PART_ID_LEFT_UPPER_LEG,
      modelId: MODEL_ID_THIGH,
      attachmentPoint: [.4, .2, -2],
      paletteIndices: [3, 3, 7],
      flipY: 1,
      attachmentTransform: matrix4MultiplyStack([
        matrix4Rotate(Math.PI/20, 1, 0, 0),
        matrix4Rotate(-Math.PI/20, 0, 1, 0),
        matrix4Translate(-.5, 0, -3.7),
        matrix4Rotate(Math.PI * .55, 0, 0, 1),
      ]),
      children: [
        {
          id: PART_ID_LEFT_LOWER_LEG,
          modelId: MODEL_ID_CALF,
          attachmentPoint: [0, 0, -3.5],
          paletteIndices: [7, 2, 8],
          attachmentTransform: matrix4MultiplyStack([
            matrix4Rotate(Math.PI/20, 0, 1, 0),
            matrix4Translate(0, 0, -2.3),
            matrix4Rotate(Math.PI/2, 0, 0, 1),
          ]),
        }
      ]
    }
  ]
}
