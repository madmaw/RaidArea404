
//
// creates a shader of the given type, uploads the source and
// compiles it.
//
const loadShader = (gl: ExtendedWebGLRenderingContext, type: number, source: string) => {

  const shader = gl['crShr'](type);

  // Send the source to the shader object

  gl['shSoe'](shader, source);

  // Compile the shader program

  gl['coShr'](shader);

  // See if it compiled successfully

  if (FLAG_SHOW_GL_ERRORS && !gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('An error occurred compiling the shaders: ', gl.getShaderInfoLog(shader));
    source.split('\n').map((line, lineNumber) => {
      console.log(lineNumber+1, line);
    });

    gl.deleteShader(shader);
    return null;
  }

  return shader;
}
