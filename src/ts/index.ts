///<reference path="./model.ts"/>
///<reference path="./gl.ts"/>
///<reference path="./math/matrix.ts"/>
///<reference path="./math/vector.ts"/>

const LONG_SHADER_NAMES = true;

const models: ModelDefinition[] = [
  // chair
  /*
  {
    [FACE_LEFT]: [0, 0, 6, 10],
    [FACE_FRONT]: [6, 0, 5, 10],
    [FACE_TOP]: [6, 10, 5, 6],
  },
  // cu
  {
    [FACE_FRONT]: [0, 10, 3, 3],
    [FACE_RIGHT]: [3, 10, 3, 3],
    [FACE_BOTTOM]: [0, 13, 3, 3],
  },
  // table
  {
    [FACE_RIGHT]: [0, 16, 11, 7],
    [FACE_FRONT]: [11, 16, 13, 7],
  },
  // untextured cube
  {
    [DIMENSION_WIDTH]: 2,
    [DIMENSION_HEIGHT]: 3,
    [DIMENSION_DEPTH]: 4
  },
  // spanner
  {
    [FACE_FRONT]: [11, 0, 5, 16],
    //[FACE_RIGHT]:[16, 0, 1, 16],
    [DIMENSION_DEPTH]: .6
  },
  // pyramid
  {
    [FACE_LEFT]: [0, 23, 3, 2],
    [FACE_FRONT]: [3, 23, 3, 2],
  },
  // tombstone
  {
    //[FACE_BOTTOM]: [0, 25, 3, 3],
    [FACE_LEFT]: [0, 25, 3, 4],
    [FACE_FRONT]: [3, 25, 3, 4],
    [FACE_RIGHT]: [6, 25, 3, 4],
    [FACE_BACK]: [9, 25, 3, 4],
    [FACE_TOP]: [3, 29, 3, 3],
    [FACE_BOTTOM]: [6, 29, 3, 3],
  },
  // crosses
  {
    [FACE_FRONT]: [12, 25, 2, 4],
    [FACE_RIGHT]: [15, 25, 2, 4],
    //[FACE_TOP]: [12, 29, 3, 3],
    //[FACE_TOP]: [3, 29, 3, 3],
  }
  */
  // legs
  {
    [FACE_RIGHT]: [13, 27, 4, 3],
    [FACE_FRONT]: [13, 20, 1, 3],
    //[FACE_TOP]: [12, 29, 3, 3],
    //[FACE_TOP]: [3, 29, 3, 3],
  }
  // spiral
  /*
  {
    [FACE_TOP]: [16, 0, 14, 16],
    [DIMENSION_HEIGHT]: 5,
  }
  */
];

// Attributes

const A_VERTEX_POSITION_INDEX = 0;
const A_VERTEX_POSITION = LONG_SHADER_NAMES ? 'aVertexPosition' : 'a';

const A_TEXTURE_COORDINATE_INDEX = 1;
const A_TEXTURE_COORDINATE = LONG_SHADER_NAMES ? 'aTextureCoordinate' : 'b';

const ATTRIBUTE_NAMES = LONG_SHADER_NAMES
    ? [A_VERTEX_POSITION, A_TEXTURE_COORDINATE]
    : 'ab'.split('');

// uniforms

const U_MODEL_VIEW_MATRIX_INDEX = 0;
const U_MODEL_VIEW_MATRIX = LONG_SHADER_NAMES ? 'uModelViewMatrix' : 'A';

const U_PROJECTION_MATRIX_INDEX = 1;
const U_PROJECTION_MATRIX = LONG_SHADER_NAMES ? 'uProjectionMatrix' : 'B';

const U_SAMPLER_INDEX = 2;
const U_SAMPLER = LONG_SHADER_NAMES ? 'uSampler' : 'C';

const UNIFORM_NAMES = LONG_SHADER_NAMES
    ? [U_MODEL_VIEW_MATRIX, U_PROJECTION_MATRIX, U_SAMPLER]
    : 'ABC'.split('');

const V_TEXURE_COORDINATE = 'vTextureCoordinate';

const PRECISION = 'lowp';

const MAIN_VS = `
attribute vec4 ${A_VERTEX_POSITION};
attribute vec2 ${A_TEXTURE_COORDINATE};

uniform mat4 ${U_MODEL_VIEW_MATRIX};
uniform mat4 ${U_PROJECTION_MATRIX};

varying vec2 ${V_TEXURE_COORDINATE};

void main() {
  gl_Position = ${U_PROJECTION_MATRIX} * ${U_MODEL_VIEW_MATRIX} * ${A_VERTEX_POSITION};
  ${V_TEXURE_COORDINATE} = ${A_TEXTURE_COORDINATE};
}
`;
const MAIN_FS = `

uniform sampler2D ${U_SAMPLER};

varying ${PRECISION} vec2 ${V_TEXURE_COORDINATE};

void main() {
  gl_FragColor = texture2D(${U_SAMPLER}, ${V_TEXURE_COORDINATE});
}
`;


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
  const modelsFaces: PerimeterPoint[][][][] = models.map(model => {
    console.log(model);
    return modelToFaces(model, i, imageWidth, imageHeight);
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

                if (textureCoordinateOriginal) {
                  context.fillStyle = 'yellow';
                  context.fillRect(x - 4/scale, y - 4/scale, 8/scale, 8/scale);
                }

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

    const perimeters = extractPerimeters(model, i, imageWidth, imageHeight);
    perimeters
        .forEach((perimeter, faceId) => {
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

              //context.fillRect(tx * imageWidth - 6/scale, ty * imageWidth - 6/scale, 12/scale, 12/scale);
            });
            context.closePath();
            context.stroke();
          }
        });
  });



  // convert the models into 3D models
  g.width = innerWidth;
  g.height = innerHeight;
  const gl = g.getContext('webgl');

  const main = initShaderProgram(gl, MAIN_VS, MAIN_FS);
  const attributes = ATTRIBUTE_NAMES.map(name => gl.getAttribLocation(main, name));
  const uniforms = UNIFORM_NAMES.map(name => gl.getUniformLocation(main, name));

  const modelBuffers = modelsFaces.map(modelFaces => {
    let vertexData: number[] = [];
    let indices: number[] = [];
    let textureCoordinates: number[] = [];

    modelFaces.map((face, faceId) => {
      const transform = FACE_TRANSFORMS[faceId];
      face.map(poly => {
        let pointCount = vertexData.length / 3;
        // NOTE I think all the polys are flat at this point, but if they aren't
        // picking a "fixed" perimeter point would ensure that the seams happen the direction we
        // want them to
        const axisPointIndex = pointCount;
        poly.map((p, i) => {
          vertexData.push(...vector3TransformMatrix4(transform, ...p.position));
          // texture coordinates should all be non-null at this point
          let textureCoordinate = p.textureCoordinate;
          if (!textureCoordinate) {
            console.log('no texture coordinates!')
            textureCoordinate = [0, 0];
          }
          textureCoordinates.push(...textureCoordinate);
          if (i > 1) {
            indices.push(axisPointIndex, axisPointIndex + i - 1, axisPointIndex + i);
          }
        });
      });
    });

    console.log(vertexData, indices, textureCoordinates);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(vertexData),
      gl.STATIC_DRAW
    );

    const textureCoordinatesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordinatesBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(textureCoordinates),
      gl.STATIC_DRAW
    );

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {
      vertexBuffer,
      indexBuffer,
      textureCoordinatesBuffer,
      indexCount: indices.length,
    };
  });

  let modelIndex = 0;

  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = innerWidth / innerHeight;
  const zNear = 0.1;
  const zFar = 100;
  const projectionMatrix = matrix4Perspective(Math.tan(fieldOfView)/2, aspect, zNear, zFar);
  const modelViewMatrix = matrix4Translate(0, 0, -20);

  let xRotation = 0;
  let yRotation = 0;

  gl.useProgram(main);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, i);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(uniforms[U_SAMPLER_INDEX], 0);

  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  const keys: {[_: number]: number} = {};

  onkeydown = (e: KeyboardEvent) => keys[e.keyCode] = 1;
  onkeyup = (e: KeyboardEvent) => keys[e.keyCode] = 0;
  window.onkeypress = (e: KeyboardEvent) => {
    console.log(e);
    if (e.key == 'a') {
      modelIndex = (modelIndex+1)%modelBuffers.length;
    }
  };

  let then = 0;
  const update = (now: number) => {

    const diff = now - then;
    then = now;
    xRotation += ((keys[38]|| 0) - (keys[40] || 0)) * diff / 400;
    yRotation += ((keys[39]|| 0) - (keys[37] || 0)) * diff / 400;

    const { indexBuffer, vertexBuffer, textureCoordinatesBuffer, indexCount } = modelBuffers[modelIndex];

    gl.clearColor(0, 0, 0, .4);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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

    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordinatesBuffer);
    gl.vertexAttribPointer(
      attributes[A_TEXTURE_COORDINATE_INDEX],
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(attributes[A_TEXTURE_COORDINATE_INDEX]);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    gl.uniformMatrix4fv(
      uniforms[U_PROJECTION_MATRIX_INDEX],
      false,
      projectionMatrix
    );
    gl.uniformMatrix4fv(
      uniforms[U_MODEL_VIEW_MATRIX_INDEX],
      false,
      matrix4MultiplyStack([modelViewMatrix, matrix4Rotate(1, 0, 0, xRotation), matrix4Rotate(0, 1, 0, yRotation)]),
    );

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(uniforms[U_SAMPLER_INDEX], 0);

    gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(update);
  };
  update(0);

  /*
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const positions = [
    -1.0,  1.0,
     1.0,  1.0,
    -1.0, -1.0,
     1.0, -1.0,
  ];
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(positions),
    gl.STATIC_DRAW
  );

  const numComponents = 2;  // pull out 2 values per iteration
  const type = gl.FLOAT;    // the data in the buffer is 32bit floats
  const normalize = false;  // don't normalize
  const stride = 0;         // how many bytes to get from one set of values to the next
                            // 0 = use type and numComponents above
  const offset = 0;         // how many bytes inside the buffer to start from
  //gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(
      attributes[A_VERTEX_POSITION_INDEX],
      numComponents,
      type,
      normalize,
      stride,
      offset);
  gl.enableVertexAttribArray(attributes[A_VERTEX_POSITION_INDEX]);



  const vertexCount = 4;
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCount);
  */
};
i.src = 'i.bmp';

type Geometry = {
  vertexData: number[],
  indices: number[],
}