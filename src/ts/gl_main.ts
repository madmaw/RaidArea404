// Attributes

const A_VERTEX_POSITION_INDEX = 0;
const A_VERTEX_POSITION = FLAG_LONG_SHADER_NAMES ? 'aVertexPosition' : 'a';

const A_TEXTURE_COORDINATE_INDEX = 1;
const A_TEXTURE_COORDINATE = FLAG_LONG_SHADER_NAMES ? 'aTextureCoordinate' : 'b';

const A_SURFACE_NORMAL_INDEX = 2;
const A_SURFACE_NORMAL = FLAG_LONG_SHADER_NAMES ? 'aSurfaceNormal' : 'c';

const ATTRIBUTE_NAMES = FLAG_LONG_SHADER_NAMES
    ? [A_VERTEX_POSITION, A_TEXTURE_COORDINATE, A_SURFACE_NORMAL]
    : 'abc'.split('');

// uniforms

const U_MODEL_VIEW_MATRIX_INDEX = 0;
const U_MODEL_VIEW_MATRIX = FLAG_LONG_SHADER_NAMES ? 'uModelViewMatrix' : 'A';

const U_PROJECTION_MATRIX_INDEX = 1;
const U_PROJECTION_MATRIX = FLAG_LONG_SHADER_NAMES ? 'uProjectionMatrix' : 'B';

const U_MODEL_TEXTURE_INDEX = 2;
const U_MODEL_TEXTURE = FLAG_LONG_SHADER_NAMES ? 'uModelTexture' : 'C';

const U_CAMERA_POSITION_INDEX = 3;
const U_CAMERA_POSITION = FLAG_LONG_SHADER_NAMES ? 'uCameraPosition' : 'D';

const U_LIGHT_INDEX = 4;
const U_LIGHT = FLAG_LONG_SHADER_NAMES ? 'uLight' : 'E';

const U_LIGHT_POSITIONS_INDEX = 5;
const U_LIGHT_POSITIONS = FLAG_LONG_SHADER_NAMES ? 'uLightPositions' : 'F';

const U_LIGHT_PROJECTIONS_INDEX = 6;
const U_LIGHT_PROJECTIONS = FLAG_LONG_SHADER_NAMES ? 'uLightProjections' : 'G';

const U_LIGHT_TEXTURES_INDEX = 7;
const U_LIGHT_TEXTURES = FLAG_LONG_SHADER_NAMES ? 'uLightTextures' : 'H';

const U_PALETTE_INDEX = 8;
const U_PALETTE = FLAG_LONG_SHADER_NAMES ? 'uPalette' : 'I';

const U_BADGES_INDEX = 9;
const U_BADGES = FLAG_LONG_SHADER_NAMES ? 'uBadges' : 'J';

const U_BADGE_TEXTURE_INDEX = 10;
const U_BADGE_TEXTURE = FLAG_LONG_SHADER_NAMES ? 'uBadgeTexture' : 'K';

const UNIFORM_NAMES = FLAG_LONG_SHADER_NAMES
    ? [
      U_MODEL_VIEW_MATRIX,
      U_PROJECTION_MATRIX,
      U_MODEL_TEXTURE,
      U_CAMERA_POSITION,
      U_LIGHT,
      U_LIGHT_POSITIONS,
      U_LIGHT_PROJECTIONS,
      U_LIGHT_TEXTURES,
      U_PALETTE,
      U_BADGES,
      U_BADGE_TEXTURE,
    ]
    : 'ABCDEFGHIJK'.split('');

const V_TEXURE_COORDINATE = FLAG_LONG_SHADER_NAMES ? 'vTextureCoordinate' : 'Z';
const V_POSITION = FLAG_LONG_SHADER_NAMES ? 'vPosition' : 'Y';
const V_SURFACE_NORMAL = FLAG_LONG_SHADER_NAMES ? 'vSurfaceNormal' : 'X';
const V_ORIGINAL_POSITION = FLAG_LONG_SHADER_NAMES ? 'vOriginalPosition' : 'W';
const V_ORIGINAL_SURFACE_NORMAL = FLAG_LONG_SHADER_NAMES ? 'vOriginalSurfaceNormal' : 'V';

const L_COLOR = FLAG_LONG_SHADER_NAMES ? 'lColor' : 'z';
const L_LIGHT = FLAG_LONG_SHADER_NAMES ? 'lLight' : 'y';
const L_CAMERA_DELTA = FLAG_LONG_SHADER_NAMES ? 'lCameraDelta' : 'x';
const L_LIGHT_NDX = FLAG_LONG_SHADER_NAMES ? 'lLightIndex' : 'w';
const L_LIGHT_DELTA = FLAG_LONG_SHADER_NAMES ? 'lLightDelta' : 'v';
const L_SHADOW_POSITION = FLAG_LONG_SHADER_NAMES ? 'lShadowPosition' : 'u'
const L_SHADOW_SCREEN_COORDINATE = FLAG_LONG_SHADER_NAMES ? 'lShadowTextureCoordinate' : 't';
const L_SHADOW_DISTANCE = FLAG_LONG_SHADER_NAMES ? 'lShadowDistance' : 's';
const L_PALETTE_NDX = FLAG_LONG_SHADER_NAMES ? 'lPaletteIndex' : 'r';
const L_BADGE_NDX = FLAG_LONG_SHADER_NAMES ? 'lBadgeIndex' : 'q';
const L_BADGE = FLAG_LONG_SHADER_NAMES ? 'lBadge' : 'p';
const L_ANGLE = FLAG_LONG_SHADER_NAMES ? 'lAngle' : 'o';
const L_Y = FLAG_LONG_SHADER_NAMES ? 'lY' : 'n';
const L_BADGE_COLOR = FLAG_LONG_SHADER_NAMES ? 'lBadgeColor' : 'm';

const PRECISION = 'highp';

const MAIN_VS = `
attribute vec4 ${A_VERTEX_POSITION};
attribute vec2 ${A_TEXTURE_COORDINATE};
attribute vec3 ${A_SURFACE_NORMAL};

uniform mat4 ${U_MODEL_VIEW_MATRIX};
uniform mat4 ${U_PROJECTION_MATRIX};

varying vec2 ${V_TEXURE_COORDINATE};
varying vec3 ${V_SURFACE_NORMAL};
varying vec4 ${V_POSITION};
varying vec4 ${V_ORIGINAL_POSITION};
varying vec3 ${V_ORIGINAL_SURFACE_NORMAL};

void main() {
  ${V_POSITION}=${U_MODEL_VIEW_MATRIX} * ${A_VERTEX_POSITION};
  ${V_TEXURE_COORDINATE}=${A_TEXTURE_COORDINATE};
  ${V_ORIGINAL_POSITION}=${A_VERTEX_POSITION};
  ${V_ORIGINAL_SURFACE_NORMAL}=${A_SURFACE_NORMAL};
  ${V_SURFACE_NORMAL}=((${U_MODEL_VIEW_MATRIX} * vec4(${A_SURFACE_NORMAL},.0)) - (${U_MODEL_VIEW_MATRIX} * vec4(.0))).xyz;
  gl_Position=${U_PROJECTION_MATRIX} * ${V_POSITION};
}
`;
const MAIN_FS = `
precision ${PRECISION} float;

uniform sampler2D ${U_MODEL_TEXTURE};
uniform vec3 ${U_CAMERA_POSITION};
uniform vec3 ${U_LIGHT};
uniform vec4 ${U_LIGHT_POSITIONS}[${CONST_MAX_LIGHTS}];
uniform mat4 ${U_LIGHT_PROJECTIONS}[${CONST_MAX_LIGHTS}];
uniform sampler2D ${U_LIGHT_TEXTURES};
uniform vec4 ${U_PALETTE}[${CONST_MAX_PALETTE}];
uniform vec4 ${U_BADGES}[${CONST_MAX_BADGES}];
uniform sampler2D ${U_BADGE_TEXTURE};

varying vec2 ${V_TEXURE_COORDINATE};
varying vec4 ${V_POSITION};
varying vec3 ${V_SURFACE_NORMAL};
varying vec4 ${V_ORIGINAL_POSITION};
varying vec3 ${V_ORIGINAL_SURFACE_NORMAL};

void main() {
  vec3 ${L_CAMERA_DELTA}=${U_CAMERA_POSITION}-${V_POSITION}.xyz;
  if(${U_LIGHT}.y>.0){
    vec4 ${L_COLOR}=texture2D(${U_MODEL_TEXTURE}, ${V_TEXURE_COORDINATE});
    float ${L_LIGHT}=${L_COLOR}.r;
    for(int ${L_PALETTE_NDX}=0;${L_PALETTE_NDX}<${CONST_MAX_PALETTE};${L_PALETTE_NDX}++){
      if(float(${L_PALETTE_NDX})<=${L_LIGHT}*${CONST_MAX_PALETTE-1}.1){
        ${L_COLOR}=${U_PALETTE}[${L_PALETTE_NDX}];
      }
    }
    ${L_LIGHT}=pow(max(${L_COLOR}.r,${L_COLOR}.g),${U_LIGHT}.x)+${U_LIGHT}.z;
    if(dot(${L_CAMERA_DELTA},${V_SURFACE_NORMAL})>.0) {
      for(int ${L_BADGE_NDX}=0;${L_BADGE_NDX}<${CONST_MAX_BADGES};${L_BADGE_NDX}++) {
        vec4 ${L_BADGE}=${U_BADGES}[${L_BADGE_NDX}];
        if(abs(${L_BADGE}.z-${V_ORIGINAL_POSITION}.z)<abs(${L_BADGE}.x)&&cos(${L_BADGE}.y-atan(${V_ORIGINAL_SURFACE_NORMAL}.y,${V_ORIGINAL_SURFACE_NORMAL}.x))>.0) {
          float ${L_Y}=(mat2(cos(-${L_BADGE}.y),-sin(-${L_BADGE}.y),sin(-${L_BADGE}.y),cos(-${L_BADGE}.y))*${V_ORIGINAL_POSITION}.xy).y/${L_BADGE}.x;
          if(abs(${L_Y})<1.0){
            vec4 ${L_BADGE_COLOR}=texture2D(
              ${U_BADGE_TEXTURE},
              vec2(
                ${L_Y}*.5/${CONST_BADGE_CHARACTERS_PER_ROW}.0+(mod(${L_BADGE}.w,${CONST_BADGE_CHARACTERS_PER_ROW}.0))/${CONST_BADGE_CHARACTERS_PER_ROW}.0-${1-.5/CONST_BADGE_CHARACTERS_PER_ROW},
                (${L_BADGE}.z-${V_ORIGINAL_POSITION}.z)*.5/abs(${L_BADGE}.x*${CONST_BADGE_CHARACTERS_PER_ROW}.0)+floor(${L_BADGE}.w/${CONST_BADGE_CHARACTERS_PER_ROW}.0)/${CONST_BADGE_CHARACTERS_PER_ROW}.0-${1-.5/CONST_BADGE_CHARACTERS_PER_ROW}
              )
            );
            ${L_COLOR}=mix(${L_COLOR},${L_BADGE_COLOR},${L_BADGE_COLOR}.a);
          }
        }
      }
    }
    for (int ${L_LIGHT_NDX}=0;${L_LIGHT_NDX}<${CONST_MAX_LIGHTS};${L_LIGHT_NDX}++){
      if (${L_LIGHT_NDX}<int(${U_LIGHT}.y)){
        vec4 ${L_SHADOW_POSITION}=${U_LIGHT_PROJECTIONS}[${L_LIGHT_NDX}]*(${V_POSITION});
        vec3 ${L_SHADOW_SCREEN_COORDINATE}=${L_SHADOW_POSITION}.xyz/${L_SHADOW_POSITION}.w;
        vec3 ${L_LIGHT_DELTA}=(${U_LIGHT_POSITIONS}[${L_LIGHT_NDX}]-${V_POSITION}).xyz;
        if(length(${L_SHADOW_SCREEN_COORDINATE}.xy)<1.0&&${L_SHADOW_SCREEN_COORDINATE}.z>.0) {
          vec4 shadowColor=texture2D(${U_LIGHT_TEXTURES},(${L_SHADOW_SCREEN_COORDINATE}.xy+1.0)/${CONST_LIGHTING_GRID_DIMENSION*2}.0+vec2(mod(float(${L_LIGHT_NDX}),${CONST_LIGHTING_GRID_DIMENSION}.0),float(${L_LIGHT_NDX}/${CONST_LIGHTING_GRID_DIMENSION}))/${CONST_LIGHTING_GRID_DIMENSION}.0);
          float ${L_SHADOW_DISTANCE}=shadowColor.a*${CONST_MAX_LIGHT_DISTANCE};
          if(${L_SHADOW_DISTANCE}+.1>length(${L_LIGHT_DELTA})) {
            ${L_LIGHT}+=pow(max(1.0-${L_COLOR}.a,dot(normalize(${L_LIGHT_DELTA}),normalize(${V_SURFACE_NORMAL})))*(1.0-pow(length(${L_SHADOW_SCREEN_COORDINATE}.xy),9.9)),2.0)*(1.0-length(${L_LIGHT_DELTA})/(${CONST_MAX_LIGHT_DISTANCE}*pow(${U_LIGHT_POSITIONS}[${L_LIGHT_NDX}].w,.5))*${U_LIGHT_POSITIONS}[${L_LIGHT_NDX}].w);
          }
        }
      }
    }
    //gl_FragColor = vec4(${L_COLOR}.rgb*${L_LIGHT}*pow(max(.0, 1.0-length(${L_CAMERA_DELTA})/${CONST_MAX_VIEW_DISTANCE}.0),.8),${L_COLOR}.a+pow((1.0-${L_COLOR}.a)*max(.0,1.0-${L_LIGHT}),.5));
    gl_FragColor = vec4(${L_COLOR}.rgb*${L_LIGHT}*pow(max(.0, 1.0-length(${L_CAMERA_DELTA})/${CONST_MAX_VIEW_DISTANCE}.0),.8),${L_COLOR}.a+(1.0-${L_COLOR}.a)*${L_LIGHT});
  } else {
    gl_FragColor = vec4(length(${L_CAMERA_DELTA})/${CONST_MAX_LIGHT_DISTANCE});
  }
}
`;

type MainProgramInputs = {
  uniforms: WebGLUniformLocation[],
  attributes: number[],
  modelBuffers: {
    vertexBuffer: WebGLBuffer,
    indexBuffer: WebGLBuffer,
    surfaceNormalBuffer: WebGLBuffer,
    textureCoordinateBuffer: WebGLBuffer,
    halfBounds: Vector3,
    indexCount: number,
  }[],
}

const initMainProgram = (gl: WebGLRenderingContext, modelsFaces: PerimeterPoint[][][][]): MainProgramInputs => {
  const main = initShaderProgram(gl, MAIN_VS, MAIN_FS);
  const attributes = ATTRIBUTE_NAMES.map(name => gl.getAttribLocation(main, name));
  const uniforms = UNIFORM_NAMES.map(name => gl.getUniformLocation(main, name));

  const modelBuffers = modelsFaces.map(modelFaces => {
    let vertexData: number[] = [];
    let indices: number[] = [];
    let textureCoordinates: number[] = [];
    let surfaceNormals: number[] = [];

    let halfBounds: Vector3 = [0, 0, 0];

    modelFaces.map((face, faceId) => {
      const transform = matrix4MultiplyStack([
        matrix4Rotate(Math.PI/2, 0, 0, 1),
        matrix4Rotate(-Math.PI/2, 1, 0, 0),
        matrix4Rotate(Math.PI, 0, 0, 1),
        FACE_TRANSFORMS[faceId],
      ]);
      face.map(poly => {
        // all polys should contain only 3 points by now
        //let pointCount = vertexData.length / 3;
        // NOTE I think all the polys are flat at this point, but if they aren't
        // picking a "fixed" perimeter point would ensure that the seams happen the direction we
        // want them to
        //const axisPointIndex = pointCount;
        const untransformedNormal = vector3CrossProduct(
          vectorNSubtract(poly[1].position, poly[0].position) as Vector3,
          vectorNSubtract(poly[2].position, poly[0].position) as Vector3,
        );

        const transformedNormal = vector3TransformMatrix4(transform, ...untransformedNormal);
        const normal = vectorNNormalize(transformedNormal);
        //const normal = [0, 0, 0];

        poly.map(p => {
          indices.push(indices.length);
          const point = vector3TransformMatrix4(transform, ...p.position);
          halfBounds = halfBounds.map((v, i) => Math.max(point[i], v)) as Vector3;
          vertexData.push(...point);
          // texture coordinates should all be non-null at this point
          //let textureCoordinate = ;
          // if (!textureCoordinate) {
          //   console.log('no texture coordinates!')
          //   textureCoordinate = [0, 0];
          // }
          textureCoordinates.push(...p.textureCoordinate);
          surfaceNormals.push(...normal);
          //surfaceNormals.push(0, 0, 1);
          // if (i > 1) {
          //   indices.push(axisPointIndex, axisPointIndex + i - 1, axisPointIndex + i);
          // }
        });
      });
    });

    // console.log(vertexData, indices, textureCoordinates);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(vertexData),
      gl.STATIC_DRAW
    );

    const textureCoordinateBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordinateBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(textureCoordinates),
      gl.STATIC_DRAW
    );

    const surfaceNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, surfaceNormalBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(surfaceNormals),
      gl.STATIC_DRAW,
    );

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {
      vertexBuffer,
      indexBuffer,
      surfaceNormalBuffer,
      textureCoordinateBuffer,
      halfBounds,
      indexCount: indices.length,
    };
  });
  gl.useProgram(main);

  return {
    uniforms,
    attributes,
    modelBuffers,
  }
}