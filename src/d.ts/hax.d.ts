type PropType<TObj, TProp extends keyof TObj> = TObj[TProp];

interface ExtendedAudioContext extends AudioContext {
  baLay: PropType<AudioContext, 'baseLatency'>;
  sud: PropType<AudioContext, 'suspend'>;
  cle: PropType<AudioContext, 'close'>;
  ree: PropType<AudioContext, 'resume'>;
  geOuTip: PropType<AudioContext, 'getOutputTimestamp'>;
  crMeElSoe: PropType<AudioContext, 'createMediaElementSource'>;
  crMeStSoe: PropType<AudioContext, 'createMediaStreamSource'>;
  crMeStDen: PropType<AudioContext, 'createMediaStreamDestination'>;
  den: PropType<AudioContext, 'destination'>;
  cuTie: PropType<AudioContext, 'currentTime'>;
  saRae: PropType<AudioContext, 'sampleRate'>;
  lir: PropType<AudioContext, 'listener'>;
  ste: PropType<AudioContext, 'state'>;
  one: PropType<AudioContext, 'onstatechange'>;
  crBur: PropType<AudioContext, 'createBuffer'>;
  deAuDaa: PropType<AudioContext, 'decodeAudioData'>;
  crBuSoe: PropType<AudioContext, 'createBufferSource'>;
  crCoSoe: PropType<AudioContext, 'createConstantSource'>;
  crGan: PropType<AudioContext, 'createGain'>;
  crDey: PropType<AudioContext, 'createDelay'>;
  crBiFir: PropType<AudioContext, 'createBiquadFilter'>;
  crIIRFilter: PropType<AudioContext, 'createIIRFilter'>;
  crWaShr: PropType<AudioContext, 'createWaveShaper'>;
  crPar: PropType<AudioContext, 'createPanner'>;
  crCor: PropType<AudioContext, 'createConvolver'>;
  crDyCor: PropType<AudioContext, 'createDynamicsCompressor'>;
  crAnr: PropType<AudioContext, 'createAnalyser'>;
  crScPrr: PropType<AudioContext, 'createScriptProcessor'>;
  crStPar: PropType<AudioContext, 'createStereoPanner'>;
  crOsr: PropType<AudioContext, 'createOscillator'>;
  crPeWae: PropType<AudioContext, 'createPeriodicWave'>;
  crChSpr: PropType<AudioContext, 'createChannelSplitter'>;
  crChMer: PropType<AudioContext, 'createChannelMerger'>;
  auWot: PropType<AudioContext, 'audioWorklet'>;
  adEvLir: PropType<AudioContext, 'addEventListener'>;
  reEvLir: PropType<AudioContext, 'removeEventListener'>;
  diEvt: PropType<AudioContext, 'dispatchEvent'>;
}

interface ExtendedAudioBuffer extends AudioBuffer {
  leh: PropType<AudioBuffer, 'length'>;
  dun: PropType<AudioBuffer, 'duration'>;
  saRae: PropType<AudioBuffer, 'sampleRate'>;
  nuOfChs: PropType<AudioBuffer, 'numberOfChannels'>;
  geChDaa: PropType<AudioBuffer, 'getChannelData'>;
  coFrChl: PropType<AudioBuffer, 'copyFromChannel'>;
  coToChl: PropType<AudioBuffer, 'copyToChannel'>;
}

interface ExtendedAudioParam extends AudioParam {
  vae: PropType<AudioParam, 'value'>;
  auRae: PropType<AudioParam, 'automationRate'>;
  deVae: PropType<AudioParam, 'defaultValue'>;
  miVae: PropType<AudioParam, 'minValue'>;
  maVae: PropType<AudioParam, 'maxValue'>;
  seVaAtTie: PropType<AudioParam, 'setValueAtTime'>;
  liRaToVaAtTime: PropType<AudioParam, 'linearRampToValueAtTime'>;
  exRaToVaAtTime: PropType<AudioParam, 'exponentialRampToValueAtTime'>;
  seTaAtTie: PropType<AudioParam, 'setTargetAtTime'>;
  seVaCuAtTime: PropType<AudioParam, 'setValueCurveAtTime'>;
  caScVas: PropType<AudioParam, 'cancelScheduledValues'>;
  caAnHoAtTime: PropType<AudioParam, 'cancelAndHoldAtTime'>;
}

interface ExtendedCanvasRenderingContext2D extends CanvasRenderingContext2D {
  cas: PropType<CanvasRenderingContext2D, 'canvas'>;
  glAla: PropType<CanvasRenderingContext2D, 'globalAlpha'>;
  glCoOpn: PropType<CanvasRenderingContext2D, 'globalCompositeOperation'>;
  fir: PropType<CanvasRenderingContext2D, 'filter'>;
  imSmEnd: PropType<CanvasRenderingContext2D, 'imageSmoothingEnabled'>;
  imSmQuy: PropType<CanvasRenderingContext2D, 'imageSmoothingQuality'>;
  stSte: PropType<CanvasRenderingContext2D, 'strokeStyle'>;
  fiSte: PropType<CanvasRenderingContext2D, 'fillStyle'>;
  shOfX: PropType<CanvasRenderingContext2D, 'shadowOffsetX'>;
  shOfY: PropType<CanvasRenderingContext2D, 'shadowOffsetY'>;
  shBlr: PropType<CanvasRenderingContext2D, 'shadowBlur'>;
  shCor: PropType<CanvasRenderingContext2D, 'shadowColor'>;
  liWih: PropType<CanvasRenderingContext2D, 'lineWidth'>;
  liCap: PropType<CanvasRenderingContext2D, 'lineCap'>;
  liJon: PropType<CanvasRenderingContext2D, 'lineJoin'>;
  miLit: PropType<CanvasRenderingContext2D, 'miterLimit'>;
  liDaOft: PropType<CanvasRenderingContext2D, 'lineDashOffset'>;
  fot: PropType<CanvasRenderingContext2D, 'font'>;
  teAln: PropType<CanvasRenderingContext2D, 'textAlign'>;
  teBae: PropType<CanvasRenderingContext2D, 'textBaseline'>;
  din: PropType<CanvasRenderingContext2D, 'direction'>;
  sae: PropType<CanvasRenderingContext2D, 'save'>;
  ree: PropType<CanvasRenderingContext2D, 'restore'>;
  sce: PropType<CanvasRenderingContext2D, 'scale'>;
  roe: PropType<CanvasRenderingContext2D, 'rotate'>;
  tre: PropType<CanvasRenderingContext2D, 'translate'>;
  trm: PropType<CanvasRenderingContext2D, 'transform'>;
  seTrm: PropType<CanvasRenderingContext2D, 'setTransform'>;
  geTrm: PropType<CanvasRenderingContext2D, 'getTransform'>;
  reTrm: PropType<CanvasRenderingContext2D, 'resetTransform'>;
  crLiGrt: PropType<CanvasRenderingContext2D, 'createLinearGradient'>;
  crRaGrt: PropType<CanvasRenderingContext2D, 'createRadialGradient'>;
  crPan: PropType<CanvasRenderingContext2D, 'createPattern'>;
  clRet: PropType<CanvasRenderingContext2D, 'clearRect'>;
  fiRet: PropType<CanvasRenderingContext2D, 'fillRect'>;
  stRet: PropType<CanvasRenderingContext2D, 'strokeRect'>;
  bePah: PropType<CanvasRenderingContext2D, 'beginPath'>;
  fil: PropType<CanvasRenderingContext2D, 'fill'>;
  ste: PropType<CanvasRenderingContext2D, 'stroke'>;
  drFoIfNed: PropType<CanvasRenderingContext2D, 'drawFocusIfNeeded'>;
  clp: PropType<CanvasRenderingContext2D, 'clip'>;
  isPoInPah: PropType<CanvasRenderingContext2D, 'isPointInPath'>;
  isPoInSte: PropType<CanvasRenderingContext2D, 'isPointInStroke'>;
  fiTet: PropType<CanvasRenderingContext2D, 'fillText'>;
  stTet: PropType<CanvasRenderingContext2D, 'strokeText'>;
  meTet: PropType<CanvasRenderingContext2D, 'measureText'>;
  drIme: PropType<CanvasRenderingContext2D, 'drawImage'>;
  geImDaa: PropType<CanvasRenderingContext2D, 'getImageData'>;
  puImDaa: PropType<CanvasRenderingContext2D, 'putImageData'>;
  crImDaa: PropType<CanvasRenderingContext2D, 'createImageData'>;
  seLiDah: PropType<CanvasRenderingContext2D, 'setLineDash'>;
  geLiDah: PropType<CanvasRenderingContext2D, 'getLineDash'>;
  clPah: PropType<CanvasRenderingContext2D, 'closePath'>;
  moTo: PropType<CanvasRenderingContext2D, 'moveTo'>;
  liTo: PropType<CanvasRenderingContext2D, 'lineTo'>;
  quCuTo: PropType<CanvasRenderingContext2D, 'quadraticCurveTo'>;
  beCuTo: PropType<CanvasRenderingContext2D, 'bezierCurveTo'>;
  arTo: PropType<CanvasRenderingContext2D, 'arcTo'>;
  ret: PropType<CanvasRenderingContext2D, 'rect'>;
  ele: PropType<CanvasRenderingContext2D, 'ellipse'>;
}

interface ExtendedWebGLRenderingContext extends WebGLRenderingContext {
  cas: PropType<WebGLRenderingContext, 'canvas'>;
  drBuWih: PropType<WebGLRenderingContext, 'drawingBufferWidth'>;
  drBuHet: PropType<WebGLRenderingContext, 'drawingBufferHeight'>;
  acTee: PropType<WebGLRenderingContext, 'activeTexture'>;
  atShr: PropType<WebGLRenderingContext, 'attachShader'>;
  biAtLon: PropType<WebGLRenderingContext, 'bindAttribLocation'>;
  biBur: PropType<WebGLRenderingContext, 'bindBuffer'>;
  biFrr: PropType<WebGLRenderingContext, 'bindFramebuffer'>;
  biRer: PropType<WebGLRenderingContext, 'bindRenderbuffer'>;
  biTee: PropType<WebGLRenderingContext, 'bindTexture'>;
  blCor: PropType<WebGLRenderingContext, 'blendColor'>;
  blEqn: PropType<WebGLRenderingContext, 'blendEquation'>;
  blEqSee: PropType<WebGLRenderingContext, 'blendEquationSeparate'>;
  blFuc: PropType<WebGLRenderingContext, 'blendFunc'>;
  blFuSee: PropType<WebGLRenderingContext, 'blendFuncSeparate'>;
  buDaa: PropType<WebGLRenderingContext, 'bufferData'>;
  buSuDaa: PropType<WebGLRenderingContext, 'bufferSubData'>;
  chFrSts: PropType<WebGLRenderingContext, 'checkFramebufferStatus'>;
  clr: PropType<WebGLRenderingContext, 'clear'>;
  clCor: PropType<WebGLRenderingContext, 'clearColor'>;
  clDeh: PropType<WebGLRenderingContext, 'clearDepth'>;
  clStl: PropType<WebGLRenderingContext, 'clearStencil'>;
  coMak: PropType<WebGLRenderingContext, 'colorMask'>;
  coShr: PropType<WebGLRenderingContext, 'compileShader'>;
  coTeIm2D: PropType<WebGLRenderingContext, 'compressedTexImage2D'>;
  coTeSuIm2D: PropType<WebGLRenderingContext, 'compressedTexSubImage2D'>;
  crBur: PropType<WebGLRenderingContext, 'createBuffer'>;
  crFrr: PropType<WebGLRenderingContext, 'createFramebuffer'>;
  crPrm: PropType<WebGLRenderingContext, 'createProgram'>;
  crRer: PropType<WebGLRenderingContext, 'createRenderbuffer'>;
  crShr: PropType<WebGLRenderingContext, 'createShader'>;
  crTee: PropType<WebGLRenderingContext, 'createTexture'>;
  cuFae: PropType<WebGLRenderingContext, 'cullFace'>;
  deBur: PropType<WebGLRenderingContext, 'deleteBuffer'>;
  deFrr: PropType<WebGLRenderingContext, 'deleteFramebuffer'>;
  dePrm: PropType<WebGLRenderingContext, 'deleteProgram'>;
  deRer: PropType<WebGLRenderingContext, 'deleteRenderbuffer'>;
  deShr: PropType<WebGLRenderingContext, 'deleteShader'>;
  deTee: PropType<WebGLRenderingContext, 'deleteTexture'>;
  deFuc: PropType<WebGLRenderingContext, 'depthFunc'>;
  deMak: PropType<WebGLRenderingContext, 'depthMask'>;
  deRae: PropType<WebGLRenderingContext, 'depthRange'>;
  die: PropType<WebGLRenderingContext, 'disable'>;
  diVeAtAry: PropType<WebGLRenderingContext, 'disableVertexAttribArray'>;
  drArs: PropType<WebGLRenderingContext, 'drawArrays'>;
  drEls: PropType<WebGLRenderingContext, 'drawElements'>;
  ene: PropType<WebGLRenderingContext, 'enable'>;
  enVeAtAry: PropType<WebGLRenderingContext, 'enableVertexAttribArray'>;
  fih: PropType<WebGLRenderingContext, 'finish'>;
  flh: PropType<WebGLRenderingContext, 'flush'>;
  frRer: PropType<WebGLRenderingContext, 'framebufferRenderbuffer'>;
  frTe2D: PropType<WebGLRenderingContext, 'framebufferTexture2D'>;
  frFae: PropType<WebGLRenderingContext, 'frontFace'>;
  geMip: PropType<WebGLRenderingContext, 'generateMipmap'>;
  geAcAtb: PropType<WebGLRenderingContext, 'getActiveAttrib'>;
  geAcUnm: PropType<WebGLRenderingContext, 'getActiveUniform'>;
  geAtShs: PropType<WebGLRenderingContext, 'getAttachedShaders'>;
  geAtLon: PropType<WebGLRenderingContext, 'getAttribLocation'>;
  geBuPar: PropType<WebGLRenderingContext, 'getBufferParameter'>;
  geCoAts: PropType<WebGLRenderingContext, 'getContextAttributes'>;
  geErr: PropType<WebGLRenderingContext, 'getError'>;
  geExn: PropType<WebGLRenderingContext, 'getExtension'>;
  geFrAtPar: PropType<WebGLRenderingContext, 'getFramebufferAttachmentParameter'>;
  gePar: PropType<WebGLRenderingContext, 'getParameter'>;
  gePrPar: PropType<WebGLRenderingContext, 'getProgramParameter'>;
  gePrInLog: PropType<WebGLRenderingContext, 'getProgramInfoLog'>;
  geRePar: PropType<WebGLRenderingContext, 'getRenderbufferParameter'>;
  geShPar: PropType<WebGLRenderingContext, 'getShaderParameter'>;
  geShInLog: PropType<WebGLRenderingContext, 'getShaderInfoLog'>;
  geShPrFot: PropType<WebGLRenderingContext, 'getShaderPrecisionFormat'>;
  geShSoe: PropType<WebGLRenderingContext, 'getShaderSource'>;
  geSuExs: PropType<WebGLRenderingContext, 'getSupportedExtensions'>;
  geTePar: PropType<WebGLRenderingContext, 'getTexParameter'>;
  geUnm: PropType<WebGLRenderingContext, 'getUniform'>;
  geUnLon: PropType<WebGLRenderingContext, 'getUniformLocation'>;
  geVeAtb: PropType<WebGLRenderingContext, 'getVertexAttrib'>;
  geVeAtOft: PropType<WebGLRenderingContext, 'getVertexAttribOffset'>;
  hit: PropType<WebGLRenderingContext, 'hint'>;
  isBur: PropType<WebGLRenderingContext, 'isBuffer'>;
  isCoLot: PropType<WebGLRenderingContext, 'isContextLost'>;
  isEnd: PropType<WebGLRenderingContext, 'isEnabled'>;
  isFrr: PropType<WebGLRenderingContext, 'isFramebuffer'>;
  isPrm: PropType<WebGLRenderingContext, 'isProgram'>;
  isRer: PropType<WebGLRenderingContext, 'isRenderbuffer'>;
  isShr: PropType<WebGLRenderingContext, 'isShader'>;
  isTee: PropType<WebGLRenderingContext, 'isTexture'>;
  liWih: PropType<WebGLRenderingContext, 'lineWidth'>;
  liPrm: PropType<WebGLRenderingContext, 'linkProgram'>;
  piSti: PropType<WebGLRenderingContext, 'pixelStorei'>;
  poOft: PropType<WebGLRenderingContext, 'polygonOffset'>;
  rePis: PropType<WebGLRenderingContext, 'readPixels'>;
  reSte: PropType<WebGLRenderingContext, 'renderbufferStorage'>;
  saCoe: PropType<WebGLRenderingContext, 'sampleCoverage'>;
  scr: PropType<WebGLRenderingContext, 'scissor'>;
  shSoe: PropType<WebGLRenderingContext, 'shaderSource'>;
  stFuc: PropType<WebGLRenderingContext, 'stencilFunc'>;
  stFuSee: PropType<WebGLRenderingContext, 'stencilFuncSeparate'>;
  stMak: PropType<WebGLRenderingContext, 'stencilMask'>;
  stMaSee: PropType<WebGLRenderingContext, 'stencilMaskSeparate'>;
  stOp: PropType<WebGLRenderingContext, 'stencilOp'>;
  stOpSee: PropType<WebGLRenderingContext, 'stencilOpSeparate'>;
  tePaf: PropType<WebGLRenderingContext, 'texParameterf'>;
  tePai: PropType<WebGLRenderingContext, 'texParameteri'>;
  teIm2D: PropType<WebGLRenderingContext, 'texImage2D'>;
  teSuIm2D: PropType<WebGLRenderingContext, 'texSubImage2D'>;
  un1f: PropType<WebGLRenderingContext, 'uniform1f'>;
  un1fv: PropType<WebGLRenderingContext, 'uniform1fv'>;
  un1i: PropType<WebGLRenderingContext, 'uniform1i'>;
  un1iv: PropType<WebGLRenderingContext, 'uniform1iv'>;
  un2f: PropType<WebGLRenderingContext, 'uniform2f'>;
  un2fv: PropType<WebGLRenderingContext, 'uniform2fv'>;
  un2i: PropType<WebGLRenderingContext, 'uniform2i'>;
  un2iv: PropType<WebGLRenderingContext, 'uniform2iv'>;
  un3f: PropType<WebGLRenderingContext, 'uniform3f'>;
  un3fv: PropType<WebGLRenderingContext, 'uniform3fv'>;
  un3i: PropType<WebGLRenderingContext, 'uniform3i'>;
  un3iv: PropType<WebGLRenderingContext, 'uniform3iv'>;
  un4f: PropType<WebGLRenderingContext, 'uniform4f'>;
  un4fv: PropType<WebGLRenderingContext, 'uniform4fv'>;
  un4i: PropType<WebGLRenderingContext, 'uniform4i'>;
  un4iv: PropType<WebGLRenderingContext, 'uniform4iv'>;
  unMa2fv: PropType<WebGLRenderingContext, 'uniformMatrix2fv'>;
  unMa3fv: PropType<WebGLRenderingContext, 'uniformMatrix3fv'>;
  unMa4fv: PropType<WebGLRenderingContext, 'uniformMatrix4fv'>;
  usPrm: PropType<WebGLRenderingContext, 'useProgram'>;
  vaPrm: PropType<WebGLRenderingContext, 'validateProgram'>;
  veAt1f: PropType<WebGLRenderingContext, 'vertexAttrib1f'>;
  veAt1fv: PropType<WebGLRenderingContext, 'vertexAttrib1fv'>;
  veAt2f: PropType<WebGLRenderingContext, 'vertexAttrib2f'>;
  veAt2fv: PropType<WebGLRenderingContext, 'vertexAttrib2fv'>;
  veAt3f: PropType<WebGLRenderingContext, 'vertexAttrib3f'>;
  veAt3fv: PropType<WebGLRenderingContext, 'vertexAttrib3fv'>;
  veAt4f: PropType<WebGLRenderingContext, 'vertexAttrib4f'>;
  veAt4fv: PropType<WebGLRenderingContext, 'vertexAttrib4fv'>;
  veAtPor: PropType<WebGLRenderingContext, 'vertexAttribPointer'>;
  vit: PropType<WebGLRenderingContext, 'viewport'>;
}