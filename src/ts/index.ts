///<reference path="./model.ts"/>
///<reference path="./gl.ts"/>
///<reference path="./math/matrix.ts"/>
///<reference path="./math/vector.ts"/>
///<reference path="./flags.ts"/>
///<reference path="./model_definitions.ts"/>
///<reference path="./pose_definitions.ts"/>
///<reference path="./body/human.ts"/>

// const v = document.createElement('img');
// v.src = 'c.bmp';
//v.onload = () => console.log('loaded');

// draw some stuff onto our local canvas
d.width = CONST_BADGE_CANVAS_DIMENSION;
d.height = CONST_BADGE_CANVAS_DIMENSION;
const context = d.getContext('2d');
const badgeColors: string[] = ['', 'red'];
const badgeDefinitions: ([number, number] | [number])[] = [
  // big eye
  //[0x2B24],
  [0x25C6],
  // 0-9A-Z, punctuation
  [45, 46],
  // grimace
  [0x2313],
  // smile/sad
  [0x2322, 2],
  // smile 2
  [0x203F],
  // eye 1
  [0xB0],
  // eye 2
  [0x2022],
  // eye 3
  [0x1D54],
  // painting
  [0x1F5BC],
  // emoji faces
  [0x1F600, 69],
  // animals
  [0x1F400, 66],
  // food
  [0x1F332, 34],
];
let badgeCount = 0;
context.font = `${CONST_BADGE_DIMENSION}px monospace`;
context.textAlign = 'center';
badgeColors.map(textColor => {
  context.fillStyle = textColor;
  badgeDefinitions.map(([codePoint, count]) => {
    for (let k=0; k<(count||1); k++) {
      const char = String.fromCodePoint(codePoint + k);
      if (FLAG_PRINT_BADGES) {
        console.log(badgeCount, char);
      }
      context.fillText(
        char,
        (badgeCount%CONST_BADGE_CHARACTERS_PER_ROW + .5)*CONST_BADGE_DIMENSION,
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
  // GLOBAL!
  modelPerimeters = models.map(model => {
    return extractPerimeters(model, i, imageWidth, imageHeight);
  });
  const modelsFaces: PerimeterPoint[][][][] = models.map((model, i) => {
    return modelToFaces(model, modelPerimeters[i]);
  });
  if (FLAG_DEBUG_MODELS) {
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
  }


  // const fakeFaces: PerimeterPoint[][] = [
  //   [
  //     {
  //       position: [-1, -1, 1],
  //       textureCoordinate: [0, 0],
  //     },
  //     {
  //       position: [1, 1, 1],
  //       textureCoordinate: [1, 1],
  //     },
  //     {
  //       position: [1, -1, 1],
  //       textureCoordinate: [1, 0],
  //     },
  //   ],
  //   [
  //     {
  //       position: [-1, -1, 1],
  //       textureCoordinate: [0, 0],
  //     },
  //     {
  //       position: [-1, 1, 1],
  //       textureCoordinate: [0, 1],
  //     },
  //     {
  //       position: [1, 1, 1],
  //       textureCoordinate: [1, 1],
  //     },
  //   ]
  // ];
  // modelsFaces.push([
  //     fakeFaces,
  //     fakeFaces,
  //     fakeFaces,
  //     fakeFaces,
  //     fakeFaces,
  //     fakeFaces,
  // ]);

  if (CONST_MAX_SCREEN_HEIGHT && CONST_MAX_SCREEN_WIDTH) {
    const aspectRatio = innerWidth/innerHeight;
    if (aspectRatio > CONST_MAX_SCREEN_WIDTH/CONST_MAX_SCREEN_HEIGHT) {
      g.width = CONST_MAX_SCREEN_WIDTH;
      g.height = CONST_MAX_SCREEN_WIDTH / aspectRatio;
    } else {
      g.width = CONST_MAX_SCREEN_HEIGHT * aspectRatio;
      g.height = CONST_MAX_SCREEN_HEIGHT;
    }
  } else {
    g.width = innerWidth;
    g.height = innerHeight;
  }
  const gl = FLAG_WEBGL_DISABLE_ANTIALIAS
    ? g.getContext('webgl', {
      alpha: false,
      antialias: false
    })
    : g.getContext('webgl', {
      alpha: false,
    });

  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const lightingTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, lightingTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, CONST_LIGHTING_TEXTURE_DIMENSION, CONST_LIGHTING_TEXTURE_DIMENSION, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  const lightingFrameBuffer = gl.createFramebuffer();

  const lightingDepthBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, lightingDepthBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, CONST_LIGHTING_TEXTURE_DIMENSION, CONST_LIGHTING_TEXTURE_DIMENSION);

  mainProgramInputs = initMainProgram(gl, modelsFaces);

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
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.uniform1i(mainProgramInputs.uniforms[U_BADGE_TEXTURE_INDEX], 2);

  let shadowGL: WebGLRenderingContext;
  let shadowProgramInputs: MainProgramInputs;
  if (FLAG_CANVAS_LIGHTING) {
    l.width = CONST_LIGHTING_TEXTURE_DIMENSION;
    l.height = CONST_LIGHTING_TEXTURE_DIMENSION;
    shadowGL = l.getContext('webgl');
    shadowProgramInputs = initMainProgram(shadowGL, modelsFaces);
  }

  const renderer = (
    gl: WebGLRenderingContext,
    inputs: MainProgramInputs,
    world: World,
    rooms: Vector2[],
    cameraPosition: Vector3,
    cameraProjection: Matrix4,
    cameraTanFOVOn2: number,
    maxCameraDistance: number,
    ambientLight: number,
    darknessFactor: number,
    lights?: LightEntity[],
    filter?: (e: Entity) => boolean,
    renderBackFaces?: boolean | number,
  ) => {
    // is it in the view?
    const screenProjection = matrix4Multiply(
      cameraProjection,
      matrix4Translate(...(cameraPosition.map(v => -v) as Vector3))
    );
    const {
      uniforms,
    } = inputs;
    gl.uniformMatrix4fv(
      uniforms[U_PROJECTION_MATRIX_INDEX],
      false,
      screenProjection,
    );
    gl.uniform3fv(
      uniforms[U_CAMERA_POSITION_INDEX],
      cameraPosition
    );
    gl.uniform3fv(
      uniforms[U_LIGHT_INDEX],
      [
        darknessFactor,
        lights ? 1 : 0,
        ambientLight,
        //0,
      ]
    );
    if (lights || !FLAG_AVOID_GL_WARNINGS) {
      const paddedLights = new Array(CONST_MAX_LIGHTS).fill(0).map<{
        position: Vector3,
        lightProjection?: Matrix4,
        lightIntensity?: number,
      }>((_, i) => {
        const light = lights && lights[i];
        return light
            ? light
            : {
              lightIntensity: 0,
              lightProjection: matrix4Identity(),
              position: [0, 0, 0],
            };
      });
      gl.uniform4fv(
        uniforms[U_LIGHT_POSITIONS_INDEX],
        paddedLights.flatMap(light => light.position.concat(light.lightIntensity)),
      );
      gl.uniformMatrix4fv(
        uniforms[U_LIGHT_PROJECTIONS_INDEX],
        false,
        paddedLights.flatMap(light =>
          matrix4Multiply(
            light.lightProjection,
            matrix4Translate(...(light.position.map(v => -v) as Vector3))
          )
        ),
      );
    }

    if (FLAG_CULL_FACES) {
      gl.enable(gl.CULL_FACE);
    }

    const invisibleEntities: Entity[] = [];
    iterateEntities(world, rooms, (entity: Entity) => {
      const entityCenterPosition = [...entity.position.slice(0, 2), entity.position[2]+entity.depth/2] as Vector3;
      // don't think this works perfectly because
      // 1. the sphere is not sperical in perspective projection
      // 2. differences in fov between vertical and horizontal
      // 3. formula assumes sphere is always centered
      const normal = vectorNSubtract(
        // all entities are positioned at thier base, so move up to get the center
        entityCenterPosition,
        cameraPosition
      );
      const d = vectorNLength(normal);
      const screenHeight = (1/cameraTanFOVOn2 * entity.renderRadius / Math.sqrt(d*d - entity.renderRadius*entity.renderRadius))*entity.renderRadius*Math.max(1, g.width / g.height);
      // const transformation = matrix4Multiply(
      //   matrix4Rotate(-Math.atan2(normal[2], normal[1]), 1, 0, 0),
      //   matrix4Rotate(-Math.atan2(vectorNLength(normal.slice(0, 2)), normal[2]), 0, 0, 1),
      // );
      // const transformation = matrix4MultiplyStack([
      //   screenProjection,
      //   matrix4Translate(...entityCenterPosition),
      //   matrix4Rotate(Math.atan2(normal[1], normal[0]), 0, 0, 1),
      //   matrix4Rotate(Math.atan2(normal[2], vectorNLength(normal.slice(0, 2))), 0, 1, 0),
      // ]);
      const screenPosition = vector3TransformMatrix4(screenProjection, ...entity.position);
      const screenLength = vectorNLength(screenPosition.slice(0, 2));

      if (screenPosition[2] > -entity.renderRadius
          && !screenPosition.some(v => Math.abs(v)>(1+screenHeight)*Math.min(Math.max(1, screenLength), 1.5))
          && (!filter || filter(entity))
          && d - entity.renderRadius < maxCameraDistance
      ) {
        // no invisible entities for shadow generation
        if (!entity.invisible || !lights) {
          // render
          const transform = matrix4MultiplyStack([
            matrix4Translate(...entity.position),
            matrix4Rotate(-entity.zRotation, 0, 0, 1),
            matrix4Scale(1, 1, entity.scale || 1),
          ]);
          bodyPartRenderer(
            gl,
            inputs,
            entity.body,
            transform,
            entity.partTransforms || {},
            entity.badges || {},
            entity.palette,
            renderBackFaces,
          );
        } else {
          invisibleEntities.push(entity);
        }
      }
    });

    if (lights) {
      gl.enable(gl.BLEND);
      gl.depthMask(false);
      // if (FLAG_CULL_FACES) {
      //   gl.disable(gl.CULL_FACE);
      // }
      // lights are already ordered nearest to furthest
      // const closestLightPosition = lights[0].position.slice(0, 2);
      // const lightCameraNormal = vectorNSubtract(closestLightPosition, cameraPosition);
      invisibleEntities.map(entity => {
        const transform = matrix4MultiplyStack([
          matrix4Translate(...entity.position),
          matrix4Rotate(-entity.zRotation, 0, 0, 1),
          matrix4Scale(1, 1, entity.scale || 1),
        ]);
        // is this entity between the camera and the closest light to the camera?
        // const lightEntityNormal = vectorNSubtract(closestLightPosition, entity.position);
        bodyPartRenderer(
          gl,
          inputs,
          entity.body,
          transform,
          entity.partTransforms || {},
          entity.badges || {},
          entity.palette,
          // vectorNDotProduct(lightEntityNormal, lightCameraNormal)<0
          //     ? renderBackFaces
          //     : !renderBackFaces,
          renderBackFaces
        );
      });
      gl.disable(gl.BLEND);
      gl.depthMask(true);
    }
  }

  const bodyPartRenderer = (
    gl: WebGLRenderingContext,
    inputs: MainProgramInputs,
    part: BodyPart,
    transform: Matrix4,
    partTransforms: {[_: number]: Matrix4},
    partBadges: {[_: number]: Vector4[]},
    palette: Vector4[],
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
    gl.uniform4fv(
      inputs.uniforms[U_PALETTE_INDEX],
      new Array(CONST_MAX_PALETTE).fill(0).flatMap((_, i) => palette[paletteIndices[i%paletteIndices.length]%palette.length])
    );

    const badges = partBadges[part.id];

    gl.uniform4fv(
      inputs.uniforms[U_BADGES_INDEX],
      new Array(CONST_MAX_BADGES).fill(0).flatMap((_, i) => badges && badges[i] || [0, 0, 0, 0]),
    );

    // indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);

    part.children?.map(child => {
      bodyPartRenderer(gl, inputs, child, m, partTransforms, partBadges, palette, renderBackFaces);
    });
  };

  const rooms = make2DArray<Room>(CONST_WORLD_ROOMS_ACROSS, CONST_WORLD_ROOMS_DOWN, (rx, ry) => {
    return {
      entities: [],
      rx,
      ry,
    }
  });
  const tiles = make2DArray<Tile>(CONST_WORLD_TILES_ACROSS, CONST_WORLD_TILES_DOWN, () => {
    return {
      lightSources: 0,
    };
  });
  const world: World = {
    age: 0,
    rooms,
    tiles,
    switches: [],
    activatedCircuits: {
      0: -9999,
    },
  };

  roomDefinitions.map((row, rx) =>
    row.map((definition, ry) => {
      const room = rooms[rx][ry];
      room.ambientLight = definition.ambientLight || 0;
      room.adjoiningRooms = definition.adjoiningRooms || 0;
      const legend = {...globalLegend, ...definition.legend || {}};
      const floorAndCeilingFactory = definition.floorAndCeilingFactory || globalFloorAndCeilingFactory;
      definition.layout.split('').map((c, i) => {
        const x = rx * CONST_ROOM_DIMENSION + i % CONST_ROOM_DIMENSION+.5;
        const y = ry * CONST_ROOM_DIMENSION + (i / CONST_ROOM_DIMENSION | 0) + .5;
        if (FLAG_CHECK_ROOM_SIZE && y - ry * CONST_ROOM_DIMENSION >= CONST_ROOM_DIMENSION) {
          console.log(`room too tall ${rx},${ry}`);
        }
        const char = c.toLowerCase();
        legend[char] && legend[char](world, x, y, char != c, c);
        if (c != ' ') {
          floorAndCeilingFactory(world, x, y, 0, c);
        }
      });
    })
  );

  const keyboardInputs: {[_: number]: number} = {};

  onkeydown = (e: KeyboardEvent) => keyboardInputs[e.keyCode] = 1;
  onkeyup = (e: KeyboardEvent) => keyboardInputs[e.keyCode] = 0;

  let engineState: EngineState = {
    keyboardInputs,
  };

  let fps: number | undefined;
  let frames = 0;

  let then = 0;
  const update = (now: number) => {
    requestAnimationFrame(update);
    const diff = CONST_MAX_DELTA ? Math.min(CONST_MAX_DELTA, now - then) : now - then;
    if (FLAG_SHOW_FPS && !FLAG_CANVAS_LIGHTING) {
      const thenSeconds = then/1000 | 0;
      const nowSeconds = now/1000 | 0;
      if (thenSeconds != nowSeconds) {
        fps = frames;
        frames = 0;
        const ctx = l.getContext('2d');
        ctx.clearRect(0, 0, l.width, l.height);
        ctx.fillStyle = 'red';
        ctx.fillText(`FPS ${fps}`, 30, 30);
      }
      frames++;
    }
    then = now;

    updater(world, engineState, diff);

    const [rx, ry] = getRoom(world.player);
    const room = world.rooms[rx][ry];
    const cameraPosition = room.cameraPosition;
    const cameraTanFOVOn2 = room.cameraTanFOVOn2 || CONST_DEFAULT_TAN_FOV_ON_2;
    const cameraDelta = vectorNSubtract(world.player.position, cameraPosition);
    const cameraZRotation = Math.atan2(cameraDelta[1], cameraDelta[0]);
    const cameraDistance = vectorNLength(cameraDelta.slice(0, 2).concat(0));
    const cameraYRotation = Math.atan2(cameraDistance, -cameraDelta[2] - world.player.depth);
    //const cameraXRotation = Math.PI/2;

    const aspect = g.width / g.height;
    const zNear = .1;
    const zFar = 99;
    const cameraProjection = matrix4MultiplyStack([
      //matrix4Perspective(Math.tan(fieldOfView)/2, aspect, zNear, zFar),
      matrix4Perspective(cameraTanFOVOn2, aspect, zNear, zFar),
      matrix4Rotate(-Math.PI/2, 0, 0, 1),
      matrix4Rotate(cameraYRotation, 0, 1, 0),
      matrix4Rotate(cameraZRotation, 0, 0, 1),
    ]);

    const adjoiningRooms = getAdjoiningRooms(world, rx, ry);

    const litEntities = (engineState.litEntities || []).sort((l1, l2) => {
      const d1 = vectorNLength(vectorNSubtract(cameraPosition, l1.position as any as Vector3));
      const d2 = vectorNLength(vectorNSubtract(cameraPosition, l2.position as any as Vector3));
      return d1 - d2;
    }).slice(0, CONST_MAX_LIGHTS);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, lightingTexture);

    if(FLAG_CANVAS_LIGHTING) {
      shadowGL.enable(gl.DEPTH_TEST);
      shadowGL.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    } else {

      gl.bindFramebuffer(gl.FRAMEBUFFER, lightingFrameBuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, lightingTexture, 0);

      gl.bindRenderbuffer(gl.RENDERBUFFER, lightingDepthBuffer);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, lightingDepthBuffer);

      gl.enable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // put something else in the active texture (texture1) so we don't attempt to read and write to the same texture
      gl.bindTexture(gl.TEXTURE_2D, modelTexture);
    }

    litEntities.map((litEntity, i) => {
      const rx = (litEntity.position[0] / CONST_ROOM_DIMENSION) | 0;
      const ry = (litEntity.position[1] / CONST_ROOM_DIMENSION) | 0;
      // only light what we can see
      const intersectingRooms = getAdjoiningRooms(world, rx, ry)
          .filter(p1 => (p1[0] == room.rx || p1[1] == room.ry) && adjoiningRooms.some(p2 => p1[0] == p2[0] && p1[1] == p1[1]));
      const lightDistance = CONST_MAX_LIGHT_DISTANCE;
      // do not create a shadow from ourself!
      const shadowFilter = (e: Entity) => e != litEntity;

      if (FLAG_CANVAS_LIGHTING) {
        shadowGL.viewport(
          (i%CONST_LIGHTING_GRID_DIMENSION)*CONST_LIGHTING_VIEWPORT_DIMENSION,
          CONST_LIGHTING_TEXTURE_DIMENSION - (i/CONST_LIGHTING_GRID_DIMENSION|0 + 1)*CONST_LIGHTING_VIEWPORT_DIMENSION,
          CONST_LIGHTING_VIEWPORT_DIMENSION,
          CONST_LIGHTING_VIEWPORT_DIMENSION
        );

        renderer(
          shadowGL,
          shadowProgramInputs,
          world,
          intersectingRooms,
          litEntity.position,
          matrix4Multiply(matrix4Scale(1, -1, 1), litEntity.lightProjection),
          litEntity.lightTanFOVOn2 || CONST_DEFAULT_TAN_FOV_ON_2,
          lightDistance,
          1,
          1,
          null,
          shadowFilter,
          1
        );
      } else {
        gl.viewport(
          (i%CONST_LIGHTING_GRID_DIMENSION)*CONST_LIGHTING_VIEWPORT_DIMENSION,
          (i/CONST_LIGHTING_GRID_DIMENSION|0)*CONST_LIGHTING_VIEWPORT_DIMENSION,
          CONST_LIGHTING_VIEWPORT_DIMENSION,
          CONST_LIGHTING_VIEWPORT_DIMENSION
        );

        renderer(
          gl,
          mainProgramInputs,
          world,
          intersectingRooms,
          litEntity.position,
          litEntity.lightProjection,
          litEntity.lightTanFOVOn2 || CONST_DEFAULT_TAN_FOV_ON_2,
          lightDistance,
          1,
          1,
          null,
          shadowFilter
        );

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
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
    } else {
      gl.bindTexture(gl.TEXTURE_2D, lightingTexture);
      if (FLAG_SQUARE_IMAGE) {
        // should always be square
        gl.generateMipmap(gl.TEXTURE_2D);
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      // gl.activeTexture(gl.TEXTURE0);
      // gl.bindTexture(gl.TEXTURE_2D, lightingTexture);

      // switch back to rendering to canvas
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, g.width, g.height);
    }

    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    renderer(
      gl,
      mainProgramInputs,
      world,
      adjoiningRooms,
      cameraPosition,
      cameraProjection,
      cameraTanFOVOn2,
      CONST_MAX_VIEW_DISTANCE,
      room.ambientLight,
      3,
      litEntities,
    );

    gl.bindTexture(gl.TEXTURE_2D, modelTexture);

  };
  update(0);
};
i.src = 'i.bmp';
