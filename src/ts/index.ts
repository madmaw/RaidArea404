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
const badgeDefinitions: ([number, number] | [number])[] = [
  // big eye
  //[0x2B24],
  //[0x25C6],
  [0x1F536],
  // eye 1
  [0xB0],
  // eye 2
  [0x2022],
  // eye 3
  [0x1D54],
  // grimace
  [0x2313],
  // smile/sad
  [0x2322, 2],
  // smile 2
  [0x203F],
  // playing cards
  [0x2660, 8],
  // 0-9A-Z, punctuation
  [45, 46],
  // warning sign, lightning bolt gender icons
  [0x26A0, 8],
  // emoji faces
  [0x1F600, 69],
  // animals
  [0x1F404, 59],
  // food
  [0x1F33F, 50],
  // ghosts and shit
  [0x1F479, 8],
];
let badgeCount = 0;
if (FLAG_SCALE_BADGES) {
  context.scale(CONST_BADGE_DIMENSION/10, CONST_BADGE_DIMENSION/10);
} else {
  context.font = `${CONST_BADGE_DIMENSION}px serif`;
}
context.textAlign = 'center';
badgeDefinitions.map(([codePoint, count]) => {
  for (let k=0; k<(count||1); k++) {
    const char = String.fromCodePoint(codePoint + k);
    if (FLAG_PRINT_BADGES) {
      console.log(badgeCount, char);
    }
    context.fillText(
      char,
      (badgeCount%CONST_BADGE_CHARACTERS_PER_ROW + .5)*(FLAG_SCALE_BADGES?10:CONST_BADGE_DIMENSION),
      ((badgeCount/CONST_BADGE_CHARACTERS_PER_ROW|0)+.85)*(FLAG_SCALE_BADGES?10:CONST_BADGE_DIMENSION)
    );
    badgeCount++;
  }
});

i.onload = () => {
  const imageWidth = i.width;
  const imageHeight = i.height;
  // GLOBAL!
  modelPerimeters = models.map(model => {
    return extractPerimeters(model, i, imageWidth, imageHeight);
  });
  const modelsFaces: PerimeterPoint[][][][] = models.map((model, i) => {
    return modelToFaces(model, modelPerimeters[i]);
  });
  if (FLAG_DEBUG_MODELS) {
    const iAspectRatio = i.width/i.height;
    const windowAspectRatio = innerWidth/innerHeight;
    let c = document.createElement('canvas');
    document.body.appendChild(c);
    if (iAspectRatio > windowAspectRatio) {
      c.height = i.height = (i.height * innerWidth) / i.width;
      c.width = i.width = innerWidth;
    } else {
      c.height = i.height = innerHeight;
      c.width = i.width = (i.width * innerHeight) / i.height;
    }
    const scale = i.width / imageWidth;
      const context = c.getContext('2d');
    context.scale(scale, scale)
    context.lineWidth = 1/scale;
    context.font = '1px serif';
    context.textAlign = 'center';
    context.lineJoin = 'round'
    modelsFaces.map((modelFaces, modelId) => {
      const model = models[modelId];

      modelFaces.map((modelFacePerimeters, faceId) => {
        context.strokeStyle = '#f5f';
        const rect = model[faceId];

        if (rect) {
          const [ox, oy, ow, oh] = rect;
          context.save();
          context.translate(ox + ow/2, oy + oh/2);

          modelFacePerimeters
              .sort((p1, p2) => {
                const getAverageDepth = (p: PerimeterPoint[]) => p.reduce((c, p) => c + p.pos[2], 0)/p.length;
                return getAverageDepth(p2) - getAverageDepth(p1);
              })
              .map(perimeter => {
                context.beginPath();
                let totalZ = 0;
                let countZ = 0;
                perimeter.map(({ pos: [x, y, z], textureCoordinateOriginal }, i) => {
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
              perimeter.map(({ pos: [x, y], textureCoordinate: [tx, ty] }, i) => {
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

              perimeter.map(({ pos: [x, y], textureCoordinate: [tx, ty] }, i) => {
                context.beginPath();
                context.moveTo(ox + ow/2 + x, oy + oh/2 + y);
                context.lineTo(tx * imageWidth, ty * imageWidth);
                context.stroke();
                context.beginPath();
                context.arc(tx * imageWidth, ty * imageWidth, 6/scale, 0, mathPI * 2);
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
  const gl: ExtendedWebGLRenderingContext = shortenMethods
    (FLAG_WEBGL_DISABLE_ANTIALIAS
        ? g.getContext('webgl', {
          alpha: false,
          antialias: false
        })
        : g.getContext('webgl', {
          alpha: false,
        }));


  const CONST_GL_RENDERBUFFER = FLAG_USE_GL_CONSTANTS?gl.RENDERBUFFER:0x8D41;
  const CONST_GL_FRAMEBUFFER = FLAG_USE_GL_CONSTANTS?gl.FRAMEBUFFER:0x8D40;
  const CONST_GL_DEPTH_COMPONENT16 = FLAG_USE_GL_CONSTANTS?gl.DEPTH_COMPONENT16:0x81A5;
  const CONST_GL_DEPTH_ATTACHMENT = FLAG_USE_GL_CONSTANTS?gl.DEPTH_ATTACHMENT:0x8D00;
  const CONST_GL_FRAGMENT_SHADER = FLAG_USE_GL_CONSTANTS?gl.FRAGMENT_SHADER:0x8B30;
  const CONST_GL_ELEMENT_ARRAY_BUFFER = FLAG_USE_GL_CONSTANTS?gl.ELEMENT_ARRAY_BUFFER:0x8893;
  const CONST_GL_COLOR_ATTACHMENT0 = FLAG_USE_GL_CONSTANTS?gl.COLOR_ATTACHMENT0:0x8CE0;
  const CONST_GL_DEPTH_TEST = FLAG_USE_GL_CONSTANTS?gl.DEPTH_TEST:0x0B71;
  const CONST_GL_CULL_FACE = FLAG_USE_GL_CONSTANTS?gl.CULL_FACE:0x0B44;
  const CONST_GL_BLEND = FLAG_USE_GL_CONSTANTS?gl.BLEND:0x0BE2;
  const CONST_GL_LESS = FLAG_USE_GL_CONSTANTS?gl.LESS:0x0201;
  const CONST_GL_FRONT = FLAG_USE_GL_CONSTANTS?gl.FRONT:0x0404;
  const CONST_GL_BACK = FLAG_USE_GL_CONSTANTS?gl.BACK:0x0405;
  const CONST_GL_COLOR_BUFFER_BIT = FLAG_USE_GL_CONSTANTS?gl.COLOR_BUFFER_BIT:0x4000;
  const CONST_GL_DEPTH_BUFFER_BIT = FLAG_USE_GL_CONSTANTS?gl.DEPTH_BUFFER_BIT:0x100;
  const CONST_GL_COLOR_AND_DEPTH_BUFFER_BIT = FLAG_USE_GL_CONSTANTS?gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT:0x4100;
  const CONST_GL_TEXTURE_2D = FLAG_USE_GL_CONSTANTS?gl.TEXTURE_2D:0x0DE1;
  const CONST_GL_UNSIGNED_BYTE = FLAG_USE_GL_CONSTANTS?gl.UNSIGNED_BYTE:0x1401;
  const CONST_GL_UNSIGNED_SHORT = FLAG_USE_GL_CONSTANTS?gl.UNSIGNED_SHORT:0x1403;
  const CONST_GL_RGBA = FLAG_USE_GL_CONSTANTS?gl.RGBA:0x1908;
  const CONST_GL_TRIANGLES = FLAG_USE_GL_CONSTANTS?gl.TRIANGLES:0x0004;
  const CONST_GL_TEXTURE0 = FLAG_USE_GL_CONSTANTS?gl.TEXTURE0:0x84C0;
  const CONST_GL_TEXTURE1 = FLAG_USE_GL_CONSTANTS?gl.TEXTURE1:0x84C1;
  const CONST_GL_TEXTURE2 = FLAG_USE_GL_CONSTANTS?gl.TEXTURE2:0x84C2;
  const CONST_GL_ARRAY_BUFFER = FLAG_USE_GL_CONSTANTS ? gl.ARRAY_BUFFER : 0x8892;
  const CONST_GL_TEXTURE_MAG_FILTER = FLAG_USE_GL_CONSTANTS ? gl.TEXTURE_MAG_FILTER : 10240;
  const CONST_GL_NEAREST = FLAG_USE_GL_CONSTANTS ? gl.NEAREST : 9728;
  const CONST_GL_TEXTURE_MIN_FILTER = FLAG_USE_GL_CONSTANTS ? gl.TEXTURE_MIN_FILTER : 10241;
  const CONST_GL_SRC_ALPHA = FLAG_USE_GL_CONSTANTS ? gl.SRC_ALPHA : 770;
  const CONST_GL_ONE_MINUS_SRC_ALPHA = FLAG_USE_GL_CONSTANTS ? gl.ONE_MINUS_SRC_ALPHA : 771;
  const CONST_GL_FLOAT = FLAG_USE_GL_CONSTANTS ? gl.FLOAT : 5126;

  gl['blFuc'](CONST_GL_SRC_ALPHA, CONST_GL_ONE_MINUS_SRC_ALPHA);

  const lightingTexture = gl['crTee']();
  gl['biTee'](CONST_GL_TEXTURE_2D, lightingTexture);
  gl['teIm2D'](CONST_GL_TEXTURE_2D, 0, CONST_GL_RGBA, CONST_LIGHTING_TEXTURE_DIMENSION, CONST_LIGHTING_TEXTURE_DIMENSION, 0, CONST_GL_RGBA, CONST_GL_UNSIGNED_BYTE, null);

  const lightingFrameBuffer = gl['crFrr']();

  const lightingDepthBuffer = gl['crRer']();
  gl['biRer'](CONST_GL_RENDERBUFFER, lightingDepthBuffer);
  gl['reSte'](CONST_GL_RENDERBUFFER, CONST_GL_DEPTH_COMPONENT16, CONST_LIGHTING_TEXTURE_DIMENSION, CONST_LIGHTING_TEXTURE_DIMENSION);

  mainProgramInputs = initMainProgram(gl, modelsFaces);

  const modelTexture = gl['crTee']();
  gl['acTee'](CONST_GL_TEXTURE0);
  gl['biTee'](CONST_GL_TEXTURE_2D, modelTexture);
  gl['teIm2D'](CONST_GL_TEXTURE_2D, 0, CONST_GL_RGBA, CONST_GL_RGBA, CONST_GL_UNSIGNED_BYTE, i);
  if (FLAG_SQUARE_IMAGE) {
    gl['geMip'](CONST_GL_TEXTURE_2D);
  } else {
    gl.texParameteri(CONST_GL_TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(CONST_GL_TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(CONST_GL_TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }
  gl['tePai'](CONST_GL_TEXTURE_2D, CONST_GL_TEXTURE_MAG_FILTER, CONST_GL_NEAREST);
  gl['un1i'](mainProgramInputs.uniforms[U_MODEL_TEXTURE_INDEX], 0);

  const badgeTexture = gl['crTee']();
  gl['acTee'](CONST_GL_TEXTURE2);
  gl['biTee'](CONST_GL_TEXTURE_2D, badgeTexture);
  gl['teIm2D'](CONST_GL_TEXTURE_2D, 0, CONST_GL_RGBA, CONST_GL_RGBA, CONST_GL_UNSIGNED_BYTE, d);
  if (FLAG_SQUARE_IMAGE) {
    gl['geMip'](CONST_GL_TEXTURE_2D);
  } else {
    gl.texParameteri(CONST_GL_TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(CONST_GL_TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  gl['tePai'](CONST_GL_TEXTURE_2D, CONST_GL_TEXTURE_MIN_FILTER, CONST_GL_NEAREST);
  gl['un1i'](mainProgramInputs.uniforms[U_BADGE_TEXTURE_INDEX], 2);

  let shadowGL: ExtendedWebGLRenderingContext;
  let shadowProgramInputs: MainProgramInputs;
  if (FLAG_CANVAS_LIGHTING) {
    l.width = CONST_LIGHTING_TEXTURE_DIMENSION;
    l.height = CONST_LIGHTING_TEXTURE_DIMENSION;
    shadowGL = shortenMethods(l.getContext('webgl'));
    shadowProgramInputs = initMainProgram(shadowGL, modelsFaces);
  }

  const renderer = (
    gl: ExtendedWebGLRenderingContext,
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
    gl['unMa4fv'](
      uniforms[U_PROJECTION_MATRIX_INDEX],
      false,
      screenProjection,
    );
    gl['un3fv'](
      uniforms[U_CAMERA_POSITION_INDEX],
      cameraPosition
    );
    gl['un3fv'](
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
        pos: Vector3,
        lightProjection?: Matrix4,
        lightIntensity?: number,
      }>((_, i) => {
        const light = lights && lights[i];
        return light
            ? light
            : {
              lightIntensity: 0,
              lightProjection: matrix4Identity(),
              pos: [0, 0, 0],
            };
      });
      gl['un4fv'](
        uniforms[U_LIGHT_POSITIONS_INDEX],
        paddedLights.flatMap(light => light.pos.concat(light.lightIntensity)),
      );
      gl['unMa4fv'](
        uniforms[U_LIGHT_PROJECTIONS_INDEX],
        false,
        paddedLights.flatMap(light =>
          matrix4Multiply(
            light.lightProjection,
            matrix4Translate(...(light.pos.map(v => -v) as Vector3))
          )
        ),
      );
    }

    if (FLAG_CULL_FACES) {
      gl['ene'](CONST_GL_CULL_FACE);
    }

    const invisibleEntities: Entity[] = [];
    iterateEntities(world, rooms, (entity: Entity) => {
      const entityCenterPosition = [...entity.pos.slice(0, 2), entity.pos[2]+entity.depthZ/2] as Vector3;
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
      const screenHeight = (1/cameraTanFOVOn2 * entity.renderRadius / mathPow(d*d - entity.renderRadius*entity.renderRadius, .5))*entity.renderRadius*mathMax(1, g.width / g.height);
      // const transformation = matrix4Multiply(
      //   matrix4Rotate(-mathAtan2(normal[2], normal[1]), 1, 0, 0),
      //   matrix4Rotate(-mathAtan2(vectorNLength(normal.slice(0, 2)), normal[2]), 0, 0, 1),
      // );
      // const transformation = matrix4MultiplyStack([
      //   screenProjection,
      //   matrix4Translate(...entityCenterPosition),
      //   matrix4Rotate(mathAtan2(normal[1], normal[0]), 0, 0, 1),
      //   matrix4Rotate(mathAtan2(normal[2], vectorNLength(normal.slice(0, 2))), 0, 1, 0),
      // ]);
      const screenPosition = vector3TransformMatrix4(screenProjection, ...entity.pos);
      const screenLength = vectorNLength(screenPosition.slice(0, 2));

      if ((!FLAG_RENDER_BEHIND_CULLING || (screenPosition[2] > -entity.renderRadius))
          && (!FLAG_RENDER_FRUSTUM_CULLING || !screenPosition.some(v => mathAbs(v)>(1+screenHeight)*mathMin(mathMax(1, screenLength), 1.5)))
          && (!FLAG_RENDER_RADIUS_CULLING || d - entity.renderRadius < maxCameraDistance)
          && (!filter || filter(entity))
      ) {
        // no invisible entities for shadow generation
        if (!entity.invisible || !lights) {
          // render
          const transform = matrix4MultiplyStack([
            matrix4Translate(...entity.pos),
            matrix4Rotate(-entity.zRotation, 0, 0, 1),
            matrix4Scale(1, 1, entity.scaleZ || 1),
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
      gl['ene'](CONST_GL_BLEND);
      gl['deMak'](false);
      // if (FLAG_CULL_FACES) {
      //   gl.disable(gl.CULL_FACE);
      // }
      // lights are already ordered nearest to furthest
      // const closestLightPosition = lights[0].position.slice(0, 2);
      // const lightCameraNormal = vectorNSubtract(closestLightPosition, cameraPosition);
      invisibleEntities
        // because depth testing is off for these, they don't interact well
        .sort((e1, e2) => vectorNLength(vectorNSubtract(e2.pos, cameraPosition)) - vectorNLength(vectorNSubtract(e1.pos, cameraPosition)))
        .map(entity => {
        const transform = matrix4MultiplyStack([
          matrix4Translate(...entity.pos),
          matrix4Rotate(-entity.zRotation, 0, 0, 1),
          matrix4Scale(1, 1, entity.scaleZ || 1),
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
      gl['die'](CONST_GL_BLEND);
      gl['deMak'](true);
    }
  }

  const bodyPartRenderer = (
    gl: ExtendedWebGLRenderingContext,
    inputs: MainProgramInputs,
    part: BodyPart,
    transform: Matrix4,
    partTransforms: {[_: number]: Matrix4},
    partBadges: {[_: number]: Vector4[]},
    palette: Vector4[],
    renderBackFaces?: boolean | number,
  ) => {
    const {
      attribs: attributes,
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
        gl['cuFae'](CONST_GL_FRONT);
      } else {
        gl['cuFae'](CONST_GL_BACK);
      }
    }

    gl['unMa4fv'](
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
    gl['biBur'](CONST_GL_ARRAY_BUFFER, vertexBuffer);
    gl['veAtPor'](
      attributes[A_VERTEX_POSITION_INDEX],
      3,
      CONST_GL_FLOAT,
      false,
      0,
      0
    );
    gl['enVeAtAry'](attributes[A_VERTEX_POSITION_INDEX]);

    // texture coordinates
    gl['biBur'](CONST_GL_ARRAY_BUFFER, textureCoordinateBuffer);
    gl['veAtPor'](
      attributes[A_TEXTURE_COORDINATE_INDEX],
      2,
      CONST_GL_FLOAT,
      false,
      0,
      0
    );
    gl['enVeAtAry'](attributes[A_TEXTURE_COORDINATE_INDEX]);

    // normals
    gl['biBur'](CONST_GL_ARRAY_BUFFER, surfaceNormalBuffer);
    gl['veAtPor'](
      attributes[A_SURFACE_NORMAL_INDEX],
      3,
      CONST_GL_FLOAT,
      false,
      0,
      0
    );
    gl['enVeAtAry'](attributes[A_SURFACE_NORMAL_INDEX]);

    const paletteIndices = part.paletteIndices || [0, 1, 2, 3];
    gl['un4fv'](
      inputs.uniforms[U_PALETTE_INDEX],
      new Array(CONST_MAX_PALETTE).fill(0).flatMap((_, i) => palette[paletteIndices[i%paletteIndices.length]%palette.length])
    );

    const badges = partBadges[part.id];

    gl['un4fv'](
      inputs.uniforms[U_BADGES_INDEX],
      new Array(CONST_MAX_BADGES).fill(0).flatMap((_, i) => badges && badges[i] || [0, 0, 0, 0]),
    );

    // indices
    gl['biBur'](CONST_GL_ELEMENT_ARRAY_BUFFER, indexBuffer);

    gl['drEls'](CONST_GL_TRIANGLES, indexCount, CONST_GL_UNSIGNED_SHORT, 0);
    // closure compiler doesn't like part.children?.map
    part.childParts && part.childParts.map(child => {
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
      lit: 0,
    };
  });
  const world: World = {
    age: 0,
    rooms,
    tiles,
    switches: [],
    alwaysUpdates: [],
    activatedCircuits: {
      0: 1,
      1: 1,
      2: 1,
      3: 1,
      4: 1,
      5: 1,
      9: 1,
    },
  };

  roomDefinitions.map((row, rx) =>
    row.map((definition, ry) => {
      const room = rooms[rx][ry];
      room.adjoiningRooms = definition.adjoiningRooms || 0;
      const legend = globalLegend;
      const floorAndCeilingFactory = globalFloorAndCeilingFactory;
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
    //visibleRoom: [0, 0],
  };

  let fps: number | undefined;
  let frames = 0;

  const aspect = g.width / g.height;
  const zNear = .1;
  const perspectiveProjection = matrix4Multiply(
    matrix4InfinitePerspective(CONST_DEFAULT_TAN_FOV_ON_2, aspect, zNear),
    matrix4Rotate(-CONST_PI_ON_2_1DP, 0, 0, 1)
  );

  let then = 0;
  const update = (now: number) => {
    requestAnimationFrame(update);
    const diff = CONST_MAX_DELTA ? mathMin(CONST_MAX_DELTA, now - then) : now - then;
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
    //const [rx, ry] = engineState.visibleRoom;
    const room = world.rooms[rx][ry];
    const cameraPosition = room.cameraPosition;
    const cameraTanFOVOn2 = CONST_DEFAULT_TAN_FOV_ON_2;
    const cameraDelta = vectorNSubtract(world.player.pos, cameraPosition);
    const cameraZRotation = mathAtan2(cameraDelta[1], cameraDelta[0]);
    const cameraDistance = vectorNLength(cameraDelta.slice(0, 2).concat(0));
    const cameraYRotation = mathAtan2(cameraDistance, -cameraDelta[2] - world.player.depthZ);
    //const cameraXRotation = mathPI/2;

    const cameraProjection = matrix4MultiplyStack([
      perspectiveProjection,
      matrix4Rotate(cameraYRotation, 0, 1, 0),
      matrix4Rotate(cameraZRotation, 0, 0, 1),
    ]);

    const adjoiningRooms = getAdjoiningRooms(world, rx, ry);

    const litEntities = (engineState.litEntities || [])
        .filter(e => e.lightIntensity)
        .sort((l1, l2) => {
          const d1 = vectorNLength(vectorNSubtract(cameraPosition, l1.pos as any as Vector3));
          const d2 = vectorNLength(vectorNSubtract(cameraPosition, l2.pos as any as Vector3));
          return d1 - d2;
        })
        .slice(0, CONST_MAX_LIGHTS);

    gl['acTee'](CONST_GL_TEXTURE1);
    gl['biTee'](CONST_GL_TEXTURE_2D, lightingTexture);

    if(FLAG_CANVAS_LIGHTING) {
      shadowGL.enable(CONST_GL_DEPTH_TEST);
      shadowGL.clear(CONST_GL_COLOR_AND_DEPTH_BUFFER_BIT);
    } else {

      gl['biFrr'](CONST_GL_FRAMEBUFFER, lightingFrameBuffer);
      gl['frTe2D'](CONST_GL_FRAMEBUFFER, CONST_GL_COLOR_ATTACHMENT0, CONST_GL_TEXTURE_2D, lightingTexture, 0);

      gl['biRer'](CONST_GL_RENDERBUFFER, lightingDepthBuffer);
      gl['frRer'](CONST_GL_FRAMEBUFFER, CONST_GL_DEPTH_ATTACHMENT, CONST_GL_RENDERBUFFER, lightingDepthBuffer);

      gl['ene'](CONST_GL_DEPTH_TEST);
      gl['die'](CONST_GL_BLEND);
      gl['clr'](CONST_GL_COLOR_AND_DEPTH_BUFFER_BIT);

      // put something else in the active texture (texture1) so we don't attempt to read and write to the same texture
      gl['biTee'](CONST_GL_TEXTURE_2D, modelTexture);
    }

    litEntities.map((litEntity, i) => {
      const rx = (litEntity.pos[0] / CONST_ROOM_DIMENSION) | 0;
      const ry = (litEntity.pos[1] / CONST_ROOM_DIMENSION) | 0;
      // only light what we can see
      const intersectingRooms = getAdjoiningRooms(world, rx, ry)
          .filter(p1 => /*(p1[0] == room.rx || p1[1] == room.ry) &&*/ adjoiningRooms.some(p2 => p1[0] == p2[0] && p1[1] == p1[1]));
      const lightDistance = CONST_MAX_LIGHT_DISTANCE;
      // do not create a shadow from ourself!
      const shadowFilter = (e: Entity) => e != litEntity && !(e.invisible < 0);

      if (FLAG_CANVAS_LIGHTING) {
        shadowGL['vit'](
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
          litEntity.pos,
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
        gl['vit'](
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
          litEntity.pos,
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
    gl['un1i'](
      mainProgramInputs.uniforms[U_LIGHT_TEXTURES_INDEX],
      1,
    );
    if (FLAG_CANVAS_LIGHTING) {
      gl['teIm2D'](CONST_GL_TEXTURE_2D, 0, CONST_GL_RGBA, CONST_GL_RGBA, CONST_GL_UNSIGNED_BYTE, l);
      if (FLAG_SQUARE_IMAGE) {
        // should always be square
        gl['geMip'](CONST_GL_TEXTURE_2D);
      } else {
        gl.texParameteri(CONST_GL_TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(CONST_GL_TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(CONST_GL_TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
    } else {
      gl['biTee'](CONST_GL_TEXTURE_2D, lightingTexture);
      if (FLAG_SQUARE_IMAGE) {
        // should always be square
        gl['geMip'](CONST_GL_TEXTURE_2D);
      } else {
        gl.texParameteri(CONST_GL_TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(CONST_GL_TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(CONST_GL_TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
      gl['tePai'](CONST_GL_TEXTURE_2D, CONST_GL_TEXTURE_MAG_FILTER, CONST_GL_NEAREST);

      // gl.activeTexture(gl.TEXTURE0);
      // gl.bindTexture(gl.TEXTURE_2D, lightingTexture);

      // switch back to rendering to canvas
      gl['biFrr'](CONST_GL_FRAMEBUFFER, null);
      gl['vit'](0, 0, g.width, g.height);
    }

    gl['ene'](CONST_GL_DEPTH_TEST);
    gl['clr'](CONST_GL_COLOR_AND_DEPTH_BUFFER_BIT);

    const deadness = mathPow((world.player.deadness || 0)/CONST_MAX_DEADNESS, 3);

    renderer(
      gl,
      mainProgramInputs,
      world,
      adjoiningRooms,
      cameraPosition,
      cameraProjection,
      cameraTanFOVOn2,
      CONST_MAX_VIEW_DISTANCE,
      -.05-deadness * 3,
      4*mathAbs(deadness),
      litEntities,
    );

    gl['biTee'](CONST_GL_TEXTURE_2D, modelTexture);

  };
  update(0);
};
i.src = 'i.bmp';
