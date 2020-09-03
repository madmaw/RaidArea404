///<reference path="./model.ts"/>
///<reference path="./gl.ts"/>
///<reference path="./math/matrix.ts"/>
///<reference path="./math/vector.ts"/>
///<reference path="./flags.ts"/>
///<reference path="./model_definitions.ts"/>

// const v = document.createElement('img');
// v.src = 'c.bmp';
//v.onload = () => console.log('loaded');

// draw some stuff onto our local canvas
d.width = CONST_BADGE_CANVAS_DIMENSION;
d.height = CONST_BADGE_CANVAS_DIMENSION;
const context = d.getContext('2d');
const badgeColors: string[] = ['', 'red'];
const badgeDefinitions: ([number, number] | [number])[] = [
  // 0-9A-Z, punctuation
  [48, 43],
  // open mouth
  [0x2302],
  // grimace
  [0x2313],
  // smile/sad
  [0x2322, 2],
  // emoji faces
  [0x1F600, 69],
  // animals
  [0x1F400, 66],
  // painting
  [0x1F5BC],
  // food
  [0x1F332, 34]];
let badgeCount = 0;
context.font = `${CONST_BADGE_DIMENSION}px monospace`;
badgeColors.map(textColor => {
  context.fillStyle = textColor;
  badgeDefinitions.map(([codePoint, count]) => {
    for (let k=0; k<(count||1); k++) {
      const char = String.fromCodePoint(codePoint + k);
      context.fillText(
        char,
        (badgeCount%CONST_BADGE_CHARACTERS_PER_ROW)*CONST_BADGE_DIMENSION,
        ((badgeCount/CONST_BADGE_CHARACTERS_PER_ROW|0)+.85)*CONST_BADGE_DIMENSION
      );
      badgeCount++;
    }
  });
});

i.onload = () => {
  const iAspectRatio = i.width/i.height;
  const windowAspectRatio = innerWidth/innerHeight;
  const imageWidth = i.width;
  const imageHeight = i.height;
  if (iAspectRatio > windowAspectRatio) {
    c.height = i.height = (i.height * innerWidth) / i.width;
    c.width = i.width = innerWidth;
  } else {
    c.height = i.height = innerHeight;
    c.width = i.width = (i.width * innerHeight) / i.height;
  }
  const scale = i.width / imageWidth;
  const modelPerimeters: PerimeterPoint[][][] = models.map(model => {
    return extractPerimeters(model, i, imageWidth, imageHeight);
  })
  const modelsFaces: PerimeterPoint[][][][] = models.map((model, i) => {
    return modelToFaces(model, modelPerimeters[i]);
  });

  const context = c.getContext('2d');
  context.scale(scale, scale)
  context.lineWidth = 1/scale;
  context.font = '1px serif';
  context.textAlign = 'center';
  context.lineJoin = 'round'
  modelsFaces.forEach((modelFaces, modelId) => {
    const model = models[modelId];

    modelFaces.forEach((modelFacePerimeters, faceId) => {
      context.strokeStyle = '#f5f';
      const rect = model[faceId];

      if (rect) {
        const [ox, oy, ow, oh] = rect;
        context.save();
        context.translate(ox + ow/2, oy + oh/2);

        modelFacePerimeters
            .sort((p1, p2) => {
              const getAverageDepth = (p: PerimeterPoint[]) => p.reduce((c, p) => c + p.position[2], 0)/p.length;
              return getAverageDepth(p2) - getAverageDepth(p1);
            })
            .forEach(perimeter => {
              context.beginPath();
              let totalZ = 0;
              let countZ = 0;
              perimeter.forEach(({ position: [x, y, z], textureCoordinateOriginal }, i) => {
                if (i) {
                  context.lineTo(x, y);
                } else {
                  context.moveTo(x, y);
                }

                // if (textureCoordinateOriginal) {
                //   context.fillStyle = 'yellow';
                //   context.fillRect(x - 4/scale, y - 4/scale, 8/scale, 8/scale);
                // }

                totalZ += z;
                countZ++;
              });
              context.fillStyle = `rgba(0, 0, ${120-30 * totalZ/countZ}, .5)`;

              context.closePath();
              context.stroke();
              context.fill();
            });
        context.restore();
      }
    });

    context.strokeStyle = '#f00';
    context.fillStyle = '#afa';
    context.lineWidth = 3/scale;

    const perimeters = modelPerimeters[modelId];
    perimeters
        .map((perimeter, faceId) => {
          const rect = model[faceId];
          if (perimeter && rect) {
            const [ox, oy, ow, oh] = rect;
            context.beginPath();
            perimeter.forEach(({ position: [x, y], textureCoordinate: [tx, ty] }, i) => {
              context.save();
              context.translate(ox + ow/2, oy + oh/2);
              if (i) {
                context.lineTo(x, y);
              } else {
                context.moveTo(x, y);
              }
              // if (fixed) {
              //   context.fillRect(x-4/scale, y-4/scale, 8/scale, 8/scale);
              // }

              context.restore();

            });
            context.closePath();
            context.stroke();
          }
          return perimeter
        }).map((perimeter, faceId) => {
          const rect = model[faceId];
          if (perimeter && rect) {
            context.strokeStyle = '#0f0';
            const [ox, oy, ow, oh] = rect;

            perimeter.forEach(({ position: [x, y], textureCoordinate: [tx, ty] }, i) => {
              context.beginPath();
              context.moveTo(ox + ow/2 + x, oy + oh/2 + y);
              context.lineTo(tx * imageWidth, ty * imageWidth);
              context.stroke();
              context.beginPath();
              context.arc(tx * imageWidth, ty * imageWidth, 6/scale, 0, Math.PI * 2);
              context.stroke();
            });
          }
        });
  });

  const fakeFaces: PerimeterPoint[][] = [
    [
      {
        position: [-1, -1, 1],
        textureCoordinate: [0, 0],
      },
      {
        position: [1, 1, 1],
        textureCoordinate: [1, 1],
      },
      {
        position: [1, -1, 1],
        textureCoordinate: [1, 0],
      },
    ],
    [
      {
        position: [-1, -1, 1],
        textureCoordinate: [0, 0],
      },
      {
        position: [-1, 1, 1],
        textureCoordinate: [0, 1],
      },
      {
        position: [1, 1, 1],
        textureCoordinate: [1, 1],
      },
    ]
  ];
  modelsFaces.push([
      fakeFaces,
      fakeFaces,
      fakeFaces,
      fakeFaces,
      fakeFaces,
      fakeFaces,
  ]);

  // convert the models into 3D models
  g.width = innerWidth;
  g.height = innerHeight;
  // g.width = 320;
  // g.height = 240;
  const gl = g.getContext('webgl');

  const lightingTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, lightingTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, CONST_LIGHTING_TEXTURE_DIMENSION, CONST_LIGHTING_TEXTURE_DIMENSION, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  const lightingFrameBuffer = gl.createFramebuffer();

  const lightingDepthBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, lightingDepthBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, CONST_LIGHTING_TEXTURE_DIMENSION, CONST_LIGHTING_TEXTURE_DIMENSION);

  const mainProgramInputs = initMainProgram(gl, modelsFaces);

  const modelTexture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, modelTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, i);
  if (FLAG_SQUARE_IMAGE) {
    gl.generateMipmap(gl.TEXTURE_2D);
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.uniform1i(mainProgramInputs.uniforms[U_MODEL_TEXTURE_INDEX], 0);

  const badgeTexture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, badgeTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, d);
  if (FLAG_SQUARE_IMAGE) {
    gl.generateMipmap(gl.TEXTURE_2D);
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }
  gl.uniform1i(mainProgramInputs.uniforms[U_BADGE_TEXTURE_INDEX], 2);

  if (FLAG_CANVAS_LIGHTING) {
    l.width = CONST_LIGHTING_TEXTURE_DIMENSION;
    l.height = CONST_LIGHTING_TEXTURE_DIMENSION;
  }
  const lightingProgramInputs = FLAG_CANVAS_LIGHTING
      ? initMainProgram(l.getContext('webgl'), modelsFaces)
      : undefined;

  const renderer = (
    gl: WebGLRenderingContext,
    inputs: MainProgramInputs,
    world: World,
    roomX: number,
    roomY: number,
    cameraProjection: Matrix4,
    cameraPosition: Vector3,
    darknessFactor: number,
    lights: {
      lightPosition: Vector3,
      lightProjection: Matrix4,
    }[],
    renderBackFaces?: boolean | number,
  ) => {

    //gl.clearColor(0, 0, 0, 0); already the default
    //gl.clearDepth(1); already the default
    gl.enable(gl.DEPTH_TEST);
    //gl.depthFunc(gl.LESS); already the default
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const {
      uniforms,
    } = inputs;
    gl.uniformMatrix4fv(
      uniforms[U_PROJECTION_MATRIX_INDEX],
      false,
      matrix4Multiply(
        cameraProjection,
        matrix4Translate(...(cameraPosition.map(v => -v) as Vector3))
      ),
    );
    gl.uniform3fv(
      uniforms[U_CAMERA_POSITION_INDEX],
      cameraPosition
    );
    gl.uniform2fv(
      uniforms[U_LIGHT_INDEX],
      [
        darknessFactor,
        lights.length
        //0,
      ]
    );
    if (lights.length || !FLAG_AVOID_GL_WARNINGS) {
      gl.uniform3fv(
        uniforms[U_LIGHT_POSITIONS_INDEX],
        lights.flatMap(light => light.lightPosition),
      );
      gl.uniformMatrix4fv(
        uniforms[U_LIGHT_PROJECTIONS_INDEX],
        false,
        lights.flatMap(light =>
          matrix4Multiply(
            light.lightProjection,
            matrix4Translate(...(light.lightPosition.map(v => -v) as Vector3))
          )
        ),
      );
    }
    iterateEntitiesInAdjoiningRooms(world, roomX, roomY, (entity: Entity) => {
      // render
      const transform = matrix4MultiplyStack([
        matrix4Translate(...entity.position),
        matrix4Rotate(-entity.zRotation, 0, 0, 1),
      ]);
      bodyPartRenderer(gl, inputs, entity.body, transform, entity.partTransforms || {}, entity.palette, renderBackFaces);
    });
  }

  const bodyPartRenderer = (
    gl: WebGLRenderingContext,
    inputs: MainProgramInputs,
    part: BodyPart,
    transform: Matrix4,
    partTransforms: {[_: number]: Matrix4},
    palette: Vector3[],
    renderBackFaces?: boolean | number,
  ) => {
    const {
      attributes,
      uniforms,
      modelBuffers,
    } = inputs;
    const m = matrix4MultiplyStack([
      transform,
      matrix4Translate(...(part.attachmentPoint || [0, 0, 0])),
      part.flipY ? matrix4Scale(1, -1, 1) : matrix4Identity(),
      partTransforms[part.id] || matrix4Identity(),
      part.attachmentTransform,
    ]);

    if (FLAG_CULL_FACES) {
      renderBackFaces = renderBackFaces && !part.flipY || !renderBackFaces && part.flipY;
      if (renderBackFaces) {
        gl.cullFace(gl.FRONT);
      } else {
        gl.cullFace(gl.BACK);
      }
    }

    gl.uniformMatrix4fv(
      uniforms[U_MODEL_VIEW_MATRIX_INDEX],
      false,
      m,
    );

    const {
      vertexBuffer,
      indexBuffer,
      textureCoordinateBuffer,
      surfaceNormalBuffer,
      indexCount,
    } = modelBuffers[part.modelId];

    // positions
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(
      attributes[A_VERTEX_POSITION_INDEX],
      3,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(attributes[A_VERTEX_POSITION_INDEX]);

    // texture coordinates
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordinateBuffer);
    gl.vertexAttribPointer(
      attributes[A_TEXTURE_COORDINATE_INDEX],
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(attributes[A_TEXTURE_COORDINATE_INDEX]);

    // normals
    gl.bindBuffer(gl.ARRAY_BUFFER, surfaceNormalBuffer);
    gl.vertexAttribPointer(
      attributes[A_SURFACE_NORMAL_INDEX],
      3,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(attributes[A_SURFACE_NORMAL_INDEX]);

    const paletteIndices = part.paletteIndices || [0, 1, 2, 3];
    gl.uniform3fv(
      inputs.uniforms[U_PALETTE_INDEX],
      new Array(CONST_MAX_PALETTE).fill(0).flatMap((_, i) => palette[paletteIndices[i%paletteIndices.length]%palette.length]),
    );
    gl.uniform4fv(
      inputs.uniforms[U_BADGES_INDEX],
      new Array(CONST_MAX_BADGES).fill(0).flatMap((_, i) => part.badges && part.badges[i] || [0, 0, 0, 0]),
    );



    // indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);

    part.children?.map(child => {
      bodyPartRenderer(gl, inputs, child, m, partTransforms, palette, renderBackFaces);
    });
  };

  let nextEntityId = 0;
  function makeStaticEntity(
    modelId: number,
    position: Vector3,
    scale: number,
    collisionType: CollisionType,
    zRotation?: number,
    palette?: Vector3[],
  ): Entity {
    palette = palette || new Array(4).fill(0).map((_, i) => new Array(3).fill(i/3) as Vector3);
    const geometry = mainProgramInputs.modelBuffers[modelId];
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
    const collisionRadiusAdjust = collisionType == COLLISION_TYPE_DYNAMIC
        ? .7
        : 1;
    return {
      id: nextEntityId++,
      depth: geometry.halfBounds[2] * 2 * scale,
      position,
      radius: vectorNLength(geometry.halfBounds.slice(0, 2).concat(0)) * scale * collisionRadiusAdjust,
      body: {
        attachmentTransform: matrix4MultiplyStack([
          matrix4Scale(scale),
          matrix4Translate(0, 0, geometry.halfBounds[2]),
        ]),
        modelId,
      },
      palette,
      velocity: [0, 0, 0],
      zRotation: zRotation || 0,
      collisionType,
      perimeter,
    }
  }

  const humanBody: BodyPart = {
    id: PART_ID_TORSO,
    attachmentPoint: [0, 0, .9],
    paletteIndices: [2, 1],
    attachmentTransform: matrix4MultiplyStack([
      matrix4Scale(.08),
      matrix4Translate(0, 0, mainProgramInputs.modelBuffers[MODEL_ID_TORSO].halfBounds[2]),
    ]),
    badges: [[1.2, Math.PI/5, 0, 125]],
    modelId: MODEL_ID_TORSO,
    children: [
      {
        id: PART_ID_HEAD,
        modelId: MODEL_ID_HEAD,
        attachmentPoint: [.2, 0, 5.5],
        paletteIndices: [0, 2, 2, 3],
        badges: [[2, 0, 0, 44]],
        attachmentTransform: matrix4MultiplyStack([
          matrix4Scale(.45),
        ]),
      },
      {
        id: PART_ID_RIGHT_UPPER_ARM,
        modelId: MODEL_ID_UPPER_ARM,
        attachmentPoint: [-.2, 2, 2.5],
        paletteIndices: [1],
        attachmentTransform: matrix4MultiplyStack([
          // matrix4Translate(0, 5, 1),
          // matrix4Rotate(0, 0, 1, Math.PI/2),
          //
          //matrix4Rotate(0, 1, 0, -Math.PI/5),
          //matrix4Rotate(1, 0, 0, -Math.PI/2),
          matrix4Scale(.8),
          matrix4Rotate(-Math.PI/30, 1, 0, 0),
          matrix4Translate(0, 0, -2),
          matrix4Rotate(-Math.PI/2, 0, 0, 1),
        ]),
        children: [
          {
            id: PART_ID_RIGHT_LOWER_ARM,
            modelId: MODEL_ID_FOREARM,
            attachmentPoint: [0, 0, -3],
            paletteIndices: [1, 2, 2],
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
        attachmentPoint: [-.2, -2, 2.5],
        paletteIndices: [1],
        attachmentTransform: matrix4MultiplyStack([
          // matrix4Translate(0, 5, 1),
           //matrix4Rotate(0, 1, 0, Math.PI/4),
          //
          //matrix4Rotate(1, 0, 0, Math.PI/5),
          matrix4Scale(.8),
          matrix4Rotate(-Math.PI/30, 1, 0, 0),
          matrix4Translate(0, 0, -2),
          //matrix4Rotate(0, 0, 1, Math.PI),
          matrix4Rotate(-Math.PI/2, 0, 0, 1),
        ]),
        children: [
          {
            id: PART_ID_LEFT_LOWER_ARM,
            modelId: MODEL_ID_FOREARM,
            attachmentPoint: [0, 0, -3],
            paletteIndices: [1, 2, 2],
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
        attachmentPoint: [2, -.3, -2.5],
        paletteIndices: [1],
        attachmentTransform: matrix4MultiplyStack([
          matrix4Rotate(Math.PI/20, 1, 0, 0),
          matrix4Translate(-2, 0, -4),
          matrix4Rotate(Math.PI * .55, 0, 0, 1),
        ]),
        children: [
          {
            id: PART_ID_RIGHT_LOWER_LEG,
            modelId: MODEL_ID_CALF,
            attachmentPoint: [0, 0, -3.5],
            paletteIndices: [1, 0, 1],
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
        attachmentPoint: [2, .3, -2.5],
        paletteIndices: [1],
        flipY: 1,
        attachmentTransform: matrix4MultiplyStack([
          matrix4Rotate(Math.PI/20, 1, 0, 0),
          matrix4Translate(-2, 0, -4),
          matrix4Rotate(Math.PI * .55, 0, 0, 1),
        ]),
        children: [
          {
            id: PART_ID_LEFT_LOWER_LEG,
            modelId: MODEL_ID_CALF,
            attachmentPoint: [0, 0, -3.5],
            paletteIndices: [1, 0, 1],
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

  const player: Entity = {
    id: nextEntityId++,
    palette: [
      [.1, .1, .2], // hair
      [.7, .4, .1], // shirt
      [.7, .6, .6], // skin
      [.6, 1, 1], // eyes
    ],
    body: humanBody,
    position: [7, 8, 0],
    depth: 1.5,
    radius: .2,
    velocity: [0, 0, 0],
    collisionType: COLLISION_TYPE_DYNAMIC,
    zRotation: 0,
    intelligence: INTELLIGENCE_USER_CONTROLLED,
    animations:{
      [ACTION_WALK]: {
        frameDuration: 300,
        keyFrames: makeWalkCycle(1)
      }
    },
  };

  const floors: Entity[] = new Array(ROOM_DIMENSION).fill(0).flatMap((v, x) => {
    return new Array(ROOM_DIMENSION).fill(0).flatMap((v, y) => {
      return [
        // floor
        makeStaticEntity(
          MODEL_ID_WALL,
          [x + .5, y + .5, -WALL_HEIGHT/WALL_WIDTH],
          1/WALL_WIDTH,
          COLLISION_TYPE_NONE,
          0,
          [
            [.2, .3, .2],
            [.2, .3, .2],
            [.1, .2, .1],
            [.1, .2, .1],
          ],
        ),
        //ceiling
        makeStaticEntity(
          MODEL_ID_WALL,
          [x + .5, y + .5, WALL_HEIGHT/WALL_WIDTH],
          1/WALL_WIDTH,
          COLLISION_TYPE_NONE,
          0,
          [
            [.3, .3, .5],
            [.3, .3, .5],
            [.3, .3, .5],
            x == 6 && y == 6 ? [1, 1, 1] : [.3, .3, .5],
          ],
        ),
      ]
    })
  });
  const wallPalette: Vector3[] = [
    [.1, .1, .1],
    [.6, .6, .5],
    [.3, .3, .5],
    [.6, .6, .5],
  ];
  const walls: Entity[] = new Array(ROOM_DIMENSION).fill(0).flatMap((v, i) => {

    return [
      makeStaticEntity(
        MODEL_ID_WALL,
        [i + .5, ROOM_DIMENSION +.5, i == 5 ? -WALL_HEIGHT/WALL_WIDTH : 0],
        1/WALL_WIDTH,
        COLLISION_TYPE_STATIC,
        0,
        wallPalette
      ),
      makeStaticEntity(
        MODEL_ID_WALL,
        [ROOM_DIMENSION +.5, i + .5, 0],
        1/WALL_WIDTH,
        COLLISION_TYPE_STATIC,
        0,
        wallPalette
      ),
      makeStaticEntity(
        MODEL_ID_WALL,
        [i +.5, -.5, i == 5 ? -WALL_HEIGHT/WALL_WIDTH : 0],
        1/WALL_WIDTH,
        COLLISION_TYPE_STATIC,
        0,
        wallPalette
      ),
      makeStaticEntity(
        MODEL_ID_WALL,
        [-.5, i + .5, 0],
        1/WALL_WIDTH,
        COLLISION_TYPE_STATIC,
        0,
        wallPalette
      )
    ];
  });

  walls.map(wall => wall.body.badges = [[1, Math.PI/2, 0, 178]]);

  const world: World = {
    bounds: [1, 1],
    age: 0,
    rooms: [[
      {
        cameraPosition: [8, 8, 2.5],
        lightPosition: [4.5, 4.5, 3],
        lightProjection: matrix4MultiplyStack([
          matrix4Perspective(Math.tan(Math.PI/2.5), 1, .1, 9),
          matrix4Rotate(-0, 1, 0, 0),
        ]),
        entities: [
          player,
          // makeStaticEntity( // fake
          //   models.length,
          //   [5, 5, 0],
          //   .888,
          //   COLLISION_TYPE_SENSOR,
          //   Math.PI/4
          // ),
          makeStaticEntity( // chair
            MODEL_ID_CHAIR,
            [3.8, 5, 0],
            .13,
            COLLISION_TYPE_STATIC,
            Math.PI/6,
            [
              [.5, .5, .6],
              [.3, .3, .4],
              [.3, .3, .4],
            ],
          ),
          makeStaticEntity( // chair
            MODEL_ID_CHAIR,
            [6.2, 5, 0],
            .1,
            COLLISION_TYPE_STATIC,
            Math.PI,
            [
              [.5, .5, .6],
              [.3, .3, .4],
              [.3, .3, .4],
            ],
          ),
          makeStaticEntity( // table
            MODEL_ID_TABLE,
            [5, 5, 0],
            .12,
            COLLISION_TYPE_STATIC,
            0,
            [
              [.5, .4, .3],
              [.5, .5, .6],
            ],
          ),
          makeStaticEntity( // spanner
            MODEL_ID_SPANNER,
            [5, 5.5, mainProgramInputs.modelBuffers[MODEL_ID_TABLE].halfBounds[2]*2*.12],
            .03,
            COLLISION_TYPE_SENSOR,
            Math.PI*2/3,
            [
              [.3, .3, .3],
              [.6, .6, .7],
              [.6, .6, .7],
              [.6, .6, .7],
            ]
          ),
          ...floors,
          ...walls
        ],
      }
    ]]
  };

  const keyboardInputs: {[_: number]: number} = {};

  onkeydown = (e: KeyboardEvent) => keyboardInputs[e.keyCode] = 1;
  onkeyup = (e: KeyboardEvent) => keyboardInputs[e.keyCode] = 0;

  let engineState: EngineState = {
    visibleRoom: [0, 0],
    player,
    keyboardInputs,
  };

  let then = 0;
  const update = (now: number) => {
    requestAnimationFrame(update);
    const diff = CONST_MAX_DELTA ? Math.min(CONST_MAX_DELTA, now - then) : now - then;
    then = now;


    const cameraPosition = world.rooms[engineState.visibleRoom[0]][engineState.visibleRoom[1]].cameraPosition;
    const cameraDelta = vectorNSubtract(player.position, cameraPosition);
    const cameraZRotation = Math.atan2(cameraDelta[1], cameraDelta[0]);
    const cameraDistance = vectorNLength(cameraDelta.slice(0, 2).concat(0));
    const cameraYRotation = Math.atan2(cameraDistance, -cameraDelta[2] - player.depth);
    //const cameraXRotation = Math.PI/2;

    const fieldOfView = Math.PI / 4;
    const aspect = innerWidth / innerHeight;
    const zNear = .1;
    const zFar = 99;
    const cameraProjection = matrix4MultiplyStack([
      //matrix4Perspective(Math.tan(fieldOfView)/2, aspect, zNear, zFar),
      matrix4Perspective(Math.tan(fieldOfView)/2, aspect, zNear, zFar),
      matrix4Rotate(-Math.PI/2, 0, 0, 1),
      matrix4Rotate(cameraYRotation, 0, 1, 0),
      matrix4Rotate(cameraZRotation, 0, 0, 1),
    ]);

    updater(world, engineState, diff);

    // TODO sort by closest first
    const litRooms = iterateAdjoiningRooms(
      world,
      engineState.visibleRoom[0],
      engineState.visibleRoom[1],
      room => room.lightPosition && room
    ).slice(0, CONST_MAX_LIGHTS);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, lightingTexture);

    litRooms.map(room => {
      if (FLAG_CANVAS_LIGHTING) {
        const lightingGL = l.getContext('webgl');
        lightingGL.viewport(0, 0, CONST_LIGHTING_TEXTURE_DIMENSION, CONST_LIGHTING_TEXTURE_DIMENSION);

        renderer(
          lightingGL,
          lightingProgramInputs,
          world,
          engineState.visibleRoom[0],
          engineState.visibleRoom[1],
          matrix4Multiply(matrix4Scale(1, -1, 1), room.lightProjection),
          room.lightPosition,
          1,
          [],
          1
        );
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, lightingFrameBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, lightingTexture, 0);

        gl.bindRenderbuffer(gl.RENDERBUFFER, lightingDepthBuffer);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, lightingDepthBuffer);

        gl.viewport(0, 0, CONST_LIGHTING_TEXTURE_DIMENSION, CONST_LIGHTING_TEXTURE_DIMENSION);
        // put something else in the active texture (texture1) so we don't attempt to read and write to the same texture
        gl.bindTexture(gl.TEXTURE_2D, modelTexture);

        renderer(
          gl,
          mainProgramInputs,
          world,
          engineState.visibleRoom[0],
          engineState.visibleRoom[1],
          room.lightProjection,
          room.lightPosition,
          1,
          [],
        );
        gl.bindTexture(gl.TEXTURE_2D, lightingTexture);
        if (FLAG_SQUARE_IMAGE) {
          // should always be square
          gl.generateMipmap(gl.TEXTURE_2D);
        } else {
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }

        // gl.activeTexture(gl.TEXTURE0);
        // gl.bindTexture(gl.TEXTURE_2D, lightingTexture);

      }
    });
    gl.uniform1i(
      mainProgramInputs.uniforms[U_LIGHT_TEXTURES_INDEX],
      1,
    );
    if (FLAG_CANVAS_LIGHTING) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, l);
      if (FLAG_SQUARE_IMAGE) {
        // should always be square
        gl.generateMipmap(gl.TEXTURE_2D);
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
    } else {
      // switch back to rendering to canvas
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, innerWidth, innerHeight);
    }

    renderer(
      gl,
      mainProgramInputs,
      world,
      engineState.visibleRoom[0],
      engineState.visibleRoom[1],
      cameraProjection,
      cameraPosition,
      3,
      litRooms,
    );

    gl.bindTexture(gl.TEXTURE_2D, modelTexture);

  };
  update(0);
};
i.src = 'i.bmp';
