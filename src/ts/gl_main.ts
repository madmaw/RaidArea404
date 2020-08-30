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

const U_SAMPLER_INDEX = 2;
const U_SAMPLER = FLAG_LONG_SHADER_NAMES ? 'uSampler' : 'C';

const U_CAMERA_POSITION_INDEX = 3;
const U_CAMERA_POSITION = FLAG_LONG_SHADER_NAMES ? 'uCameraPosition' : 'D';

const U_LIGHT_INDEX = 4;
const U_LIGHT = FLAG_LONG_SHADER_NAMES ? 'uLight' : 'E';

const U_LIGHT_POSITIONS_INDEX = 5;
const U_LIGHT_POSITIONS = FLAG_LONG_SHADER_NAMES ? 'uLightPositions' : 'F';

const U_LIGHT_PROJECTIONS_INDEX = 6;
const U_LIGHT_PROJECTIONS = FLAG_LONG_SHADER_NAMES ? 'uLightProjections' : 'G';

const UNIFORM_NAMES = FLAG_LONG_SHADER_NAMES
    ? [
      U_MODEL_VIEW_MATRIX,
      U_PROJECTION_MATRIX,
      U_SAMPLER,
      U_CAMERA_POSITION,
      U_LIGHT,
      U_LIGHT_POSITIONS,
      U_LIGHT_PROJECTIONS,
    ]
    : 'ABCDEFG'.split('');

const V_TEXURE_COORDINATE = FLAG_LONG_SHADER_NAMES ? 'vTextureCoordinate' : 'Z';
const V_POSITION = FLAG_LONG_SHADER_NAMES ? 'vPosition' : 'Y';
const V_SURFACE_NORMAL = FLAG_LONG_SHADER_NAMES ? 'vSurfaceNormal' : 'X';

const L_COLOR = FLAG_LONG_SHADER_NAMES ? 'lColor' : 'z';
const L_LIGHT = FLAG_LONG_SHADER_NAMES ? 'lLight' : 'y';
const L_CAMERA_DELTA = FLAG_LONG_SHADER_NAMES ? 'lCameraDelta' : 'x';
const L_LIGHT_INDEX = FLAG_LONG_SHADER_NAMES ? 'lLightIndex' : 'w';
const L_LIGHT_DELTA = FLAG_LONG_SHADER_NAMES ? 'lLightDelta' : 'v';
const L_SHADOW_POSITION = FLAG_LONG_SHADER_NAMES ? 'lShadowPosition' : 'u'
const L_SHADOW_TEXTURE_COORDINATE = FLAG_LONG_SHADER_NAMES ? 'lShadowTextureCoordinate' : 't';

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

void main() {
  ${V_POSITION}=${U_MODEL_VIEW_MATRIX} * ${A_VERTEX_POSITION};
  ${V_TEXURE_COORDINATE}=${A_TEXTURE_COORDINATE};
  ${V_SURFACE_NORMAL}=((${U_MODEL_VIEW_MATRIX} * vec4(${A_SURFACE_NORMAL},0.0)) - (${U_MODEL_VIEW_MATRIX} * vec4(0.0))).xyz;
  gl_Position=${U_PROJECTION_MATRIX} * ${V_POSITION};
}
`;
const MAIN_FS = `
precision ${PRECISION} float;

uniform sampler2D ${U_SAMPLER};
uniform vec3 ${U_CAMERA_POSITION};
uniform mat4 ${U_PROJECTION_MATRIX};
uniform vec2 ${U_LIGHT};
uniform vec3 ${U_LIGHT_POSITIONS}[${CONST_MAX_LIGHTS}];
uniform mat4 ${U_LIGHT_PROJECTIONS}[${CONST_MAX_LIGHTS}];

varying vec2 ${V_TEXURE_COORDINATE};
varying vec4 ${V_POSITION};
varying vec3 ${V_SURFACE_NORMAL};

void main() {
  vec3 ${L_COLOR}=texture2D(${U_SAMPLER}, ${V_TEXURE_COORDINATE}).rgb;
  float ${L_LIGHT}=pow(${L_COLOR}.r,${U_LIGHT}.x);
  for (int ${L_LIGHT_INDEX}=0;${L_LIGHT_INDEX}<${CONST_MAX_LIGHTS};${L_LIGHT_INDEX}++){
    if (${L_LIGHT_INDEX}<int(${U_LIGHT}.y)){
      vec4 ${L_SHADOW_POSITION}=${U_LIGHT_PROJECTIONS}[${L_LIGHT_INDEX}]*(${V_POSITION});
      vec3 ${L_SHADOW_TEXTURE_COORDINATE}=${L_SHADOW_POSITION}.xyz/${L_SHADOW_POSITION}.w;
      if(length(${L_SHADOW_TEXTURE_COORDINATE}.xy)<1.0&&${L_SHADOW_TEXTURE_COORDINATE}.z>0.0) {
        vec3 ${L_LIGHT_DELTA}=${U_LIGHT_POSITIONS}[${L_LIGHT_INDEX}]-${V_POSITION}.xyz;
        ${L_LIGHT}+=max(0.0,dot(normalize(${L_LIGHT_DELTA}),normalize(${V_SURFACE_NORMAL})));
      }
    }
  }
  vec3 ${L_CAMERA_DELTA}=${U_CAMERA_POSITION}-${V_POSITION}.xyz;
  gl_FragColor = vec4(${L_COLOR}*${L_LIGHT}, 1.0-length(${L_CAMERA_DELTA})/9.9);
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
  if (FLAG_CULL_FACES) {
    gl.enable(gl.CULL_FACE);
  }

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

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, i);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(uniforms[U_SAMPLER_INDEX], 0);

  if (FLAG_SQUARE_IMAGE) {
    gl.generateMipmap(gl.TEXTURE_2D);
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(uniforms[U_SAMPLER_INDEX], 0);

  return {
    uniforms,
    attributes,
    modelBuffers,
  }
}