///<reference path="./model.ts"/>
///<reference path="./gl.ts"/>
///<reference path="./math/matrix.ts"/>
///<reference path="./math/vector.ts"/>
///<reference path="./flags.ts"/>
///<reference path="./model_definitions.ts"/>

// const v = document.createElement('img');
// v.src = 'c.bmp';
//v.onload = () => console.log('loaded');

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



  // convert the models into 3D models
  g.width = innerWidth;
  g.height = innerHeight;
  // g.width = 320;
  // g.height = 240;
  const gl = g.getContext('webgl');
  const mainProgramInputs = initMainProgram(gl, modelsFaces);

  l.width = 200;
  l.height = 200;

  const lightingGLCanvases = [l];
  const lightingProgramInputs = lightingGLCanvases.map(c => initMainProgram(c.getContext('webgl'), modelsFaces));

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
    }[]
  ) => {

    gl.clearColor(0, 0, 0, .4);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
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
      entityRenderer(gl, inputs, entity.body, transform, entity.partTransforms || {});
    });
  }

  const entityRenderer = (
    gl: WebGLRenderingContext,
    inputs: MainProgramInputs,
    part: BodyPart,
    transform: Matrix4,
    partTransforms: {[_: number]: Matrix4},
    renderBackFaces?: boolean | number
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

    // indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);

    part.children?.map(child => {
      entityRenderer(gl, inputs, child, m, partTransforms, renderBackFaces);
    });
  };

  let nextEntityId = 0;
  function makeStaticEntity(
    modelId: number,
    position: Vector3,
    scale: number,
    collisionType: CollisionType,
    zRotation?: number,
  ): Entity {
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
      velocity: [0, 0, 0],
      zRotation: zRotation || 0,
      collisionType,
      perimeter,
    }
  }

  const humanBody: BodyPart = {
    id: PART_ID_TORSO,
    attachmentPoint: [0, 0, 1.07],
    attachmentTransform: matrix4MultiplyStack([

      matrix4Scale(.08),
      matrix4Translate(0, 0, mainProgramInputs.modelBuffers[MODEL_ID_TORSO].halfBounds[2]),
    ]),
    modelId: MODEL_ID_TORSO,
    children: [
      {
        id: PART_ID_HEAD,
        modelId: MODEL_ID_HEAD,
        attachmentPoint: [.2, 0, 5.5],
        attachmentTransform: matrix4MultiplyStack([
          matrix4Scale(.45),
        ]),
      },
      {
        id: PART_ID_RIGHT_UPPER_ARM,
        modelId: MODEL_ID_UPPER_ARM,
        attachmentPoint: [0, 2, 2.5],
        attachmentTransform: matrix4MultiplyStack([
          // matrix4Translate(0, 5, 1),
          // matrix4Rotate(0, 0, 1, Math.PI/2),
          //
          //matrix4Rotate(0, 1, 0, -Math.PI/5),
          //matrix4Rotate(1, 0, 0, -Math.PI/2),
          matrix4Scale(.8),
          matrix4Translate(0, 0, -2),
          matrix4Rotate(-Math.PI/2, 0, 0, 1),
        ]),
        children: [
          {
            id: PART_ID_RIGHT_LOWER_ARM,
            modelId: MODEL_ID_FOREARM,
            attachmentPoint: [0, 0, -3],
            attachmentTransform: matrix4MultiplyStack([
              matrix4Rotate(Math.PI/5, 1, 0, 0),
              matrix4Translate(1, -.5, -2.8),
            ]),
          }
        ],
      },
      {
        id: PART_ID_LEFT_UPPER_ARM,
        modelId: MODEL_ID_UPPER_ARM,
        flipY: 1,
        attachmentPoint: [0, -2, 2.5],
        attachmentTransform: matrix4MultiplyStack([
          // matrix4Translate(0, 5, 1),
           //matrix4Rotate(0, 1, 0, Math.PI/4),
          //
          //matrix4Rotate(1, 0, 0, Math.PI/5),
          matrix4Scale(.8),
          matrix4Translate(0, 0, -2),
          //matrix4Rotate(0, 0, 1, Math.PI),
          matrix4Rotate(-Math.PI/2, 0, 0, 1),
        ]),
        children: [
          {
            id: PART_ID_LEFT_LOWER_ARM,
            modelId: MODEL_ID_FOREARM,
            attachmentPoint: [0, 0, -3],
            attachmentTransform: matrix4MultiplyStack([
              matrix4Rotate(Math.PI/5, 1, 0, 0),
              matrix4Translate(1, -.5, -2.8),
            ]),
          }
        ],
      },
      // right thigh
      {
        id: PART_ID_RIGHT_UPPER_LEG,
        modelId: MODEL_ID_THIGH,
        attachmentPoint: [0, -.5, -4],
        attachmentTransform: matrix4MultiplyStack([
          matrix4Rotate(Math.PI/20, 1, 0, 0),
          matrix4Translate(0, 0, -3),
          matrix4Rotate(Math.PI * .55, 0, 0, 1),
        ]),
        children: [
          {
            id: PART_ID_RIGHT_LOWER_LEG,
            modelId: MODEL_ID_CALF,
            attachmentPoint: [0, 0, -5],
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
        attachmentPoint: [0, .5, -4],
        flipY: 1,
        attachmentTransform: matrix4MultiplyStack([
          matrix4Rotate(Math.PI/20, 1, 0, 0),
          matrix4Translate(0, 0, -3),
          matrix4Rotate(Math.PI * .55, 0, 0, 1),
        ]),
        children: [
          {
            id: PART_ID_LEFT_LOWER_LEG,
            modelId: MODEL_ID_CALF,
            attachmentPoint: [0, 0, -5],
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
    body: humanBody,
    position: [3, 2, 0],
    depth: 1.5,
    radius: .2,
    velocity: [0, 0, 0],
    collisionType: COLLISION_TYPE_DYNAMIC,
    zRotation: Math.PI,
    intelligence: INTELLIGENCE_USER_CONTROLLED,
    animations:{
      [ACTION_WALK]: {
        frameDuration: 400,
        keyFrames: makeWalkCycle(1)
      }
    },
  };

  const floors: Entity[] = new Array(ROOM_DIMENSION).fill(0).flatMap((v, x) => {
    return new Array(ROOM_DIMENSION).fill(0).flatMap((v, y) => {
      return [
        makeStaticEntity(
          MODEL_ID_WALL,
          [x + .5, y + .5, -WALL_HEIGHT/WALL_WIDTH],
          1/WALL_WIDTH,
          COLLISION_TYPE_NONE,
        ),
        makeStaticEntity(
          MODEL_ID_WALL,
          [x + .5, y + .5, WALL_HEIGHT/WALL_WIDTH],
          1/WALL_WIDTH,
          COLLISION_TYPE_NONE,
        ),
      ]
    })
  });
  const walls: Entity[] = new Array(ROOM_DIMENSION).fill(0).flatMap((v, i) => {

    return [
      makeStaticEntity(
        MODEL_ID_WALL,
        [i + .5, ROOM_DIMENSION +.5, i == 5 ? -WALL_HEIGHT/WALL_WIDTH : 0],
        1/WALL_WIDTH,
        COLLISION_TYPE_STATIC,
      ),
      makeStaticEntity(
        MODEL_ID_WALL,
        [ROOM_DIMENSION +.5, i + .5, 0],
        1/WALL_WIDTH,
        COLLISION_TYPE_STATIC,
      ),
      makeStaticEntity(
        MODEL_ID_WALL,
        [i +.5, -.5, i == 5 ? -WALL_HEIGHT/WALL_WIDTH : 0],
        1/WALL_WIDTH,
        COLLISION_TYPE_STATIC,
      ),
      makeStaticEntity(
        MODEL_ID_WALL,
        [-.5, i + .5, 0],
        1/WALL_WIDTH,
        COLLISION_TYPE_STATIC,
      )
    ];
  });

  const world: World = {
    bounds: [1, 1],
    age: 0,
    rooms: [[
      {
        cameraPosition: [4, 4, 3],
        lightPosition: [4.5, 4.5, 3],
        lightProjection: matrix4MultiplyStack([
          matrix4Perspective(Math.tan(Math.PI/3), 1, .1, 9),
          matrix4Rotate(-0, 1, 0, 0),
        ]),
        entities: [
          player,
          // makeEntity( // spanner
          //   modelBuffers[2],
          //   [1.5, 1.5, 0],
          //   .02,
          //   COLLISION_TYPE_SENSOR
          // ),
          makeStaticEntity( // chair
            MODEL_ID_CHAIR,
            [3, 6, 0],
            .15,
            COLLISION_TYPE_STATIC,
            -Math.PI/6
          ),
          makeStaticEntity( // table
            MODEL_ID_TABLE,
            [5, 3, 0],
            .15,
            COLLISION_TYPE_STATIC,
            Math.PI/2
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

    const litRooms = iterateAdjoiningRooms(
      world,
      engineState.visibleRoom[0],
      engineState.visibleRoom[1],
      room => room.lightPosition && room
    )
    litRooms.map((room, i) => {
      //console.log(vector3TransformMatrix4(room.lightProjection, 0, 0, 0));
      const canvas = lightingGLCanvases[i];
      renderer(
        canvas.getContext('webgl'),
        lightingProgramInputs[i],
        world,
        engineState.visibleRoom[0],
        engineState.visibleRoom[1],
        room.lightProjection,
        room.lightPosition,
        1,
        []
      );
    });

    renderer(
      gl,
      mainProgramInputs,
      world,
      engineState.visibleRoom[0],
      engineState.visibleRoom[1],
      cameraProjection,
      cameraPosition,
      9,
      litRooms,
    );

  };
  update(0);
};
i.src = 'i.bmp';
