type SoundEffect3D = (position: Vector3, intensity: number) => void;

function audioDisconnect(nodes: AudioNode[]) {
  for( let node of nodes ) {
      if( node ) {
          node.disconnect();
      }
  }
}

function audioDisconnectSingleNode(node: AudioNode) {
  if( node ) {
      node.disconnect();
  }
}

let audioContext: AudioContext;
function lazySoundEffect(f: (audioContext: AudioContext) => SoundEffect3D): SoundEffect3D {
  let soundEffect: SoundEffect3D;
  return (position: Vector3, intensity: number) => {
    if (!audioContext) {
      if( FLAG_CHECK_WEBKIT_AUDIO_CONTEXT && window["webkitAudioContext"] ) {
        audioContext = new window["webkitAudioContext"]();
      } else {
        audioContext = new AudioContext();
      }
    }
    if (!soundEffect) {
      soundEffect = f(audioContext);
    }
    soundEffect(position, intensity);
  }
}

function linearRampGain(gain: GainNode, now: number, attackVolume: number, sustainVolume, attackSeconds: number, decaySeconds: number, sustainSeconds:number, durationSeconds: number) {
  gain.gain.value = 0;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(attackVolume, now + attackSeconds);
  gain.gain.linearRampToValueAtTime(sustainVolume, now + decaySeconds);
  if (sustainSeconds) {
      gain.gain.linearRampToValueAtTime(sustainVolume, now + sustainSeconds);
  }
  gain.gain.linearRampToValueAtTime(0, now + durationSeconds);

}

function webAudioBoomSoundEffectFactory(
  audioContext: AudioContext,
  durationSeconds: number,
  attackSeconds: number,
  filterFrequency: number,
  attackVolume: number,
  sustainVolume: number
): SoundEffect3D {
  const sampleRate = audioContext.sampleRate;
  let frameCount = durationSeconds * sampleRate | 0;
  const buffer = audioContext.createBuffer(1, frameCount, sampleRate);
  const data = buffer.getChannelData(0);

  while (frameCount--) {
    data[frameCount] = Math.random() * 2 - 1;
  }

  return (position: Vector3, volume: number) => {
    // set up the frequency
    if( !volume) {
      volume = 1;
    }

    var staticNode = audioContext.createBufferSource();
    staticNode.buffer = buffer;
    staticNode.loop = true;

    var filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 0;
    filter.frequency.value = filterFrequency;

    //decay
    var gain = audioContext.createGain();
    var decay = durationSeconds * .2;
    linearRampGain(gain, audioContext.currentTime, attackVolume * volume, sustainVolume * volume, attackSeconds, decay, null, durationSeconds);

    let panner = audioContext.createPanner();
    panner.refDistance = CONST_MAX_SOUND_RADIUS_SQRT * attackVolume * 9;
    if( FLAG_AUDIO_SET_DISTANCE_MODEL_EXPONENTIAL ) {
      panner.distanceModel = 'exponential';
    }
    panner.setPosition(...position);

    staticNode.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(audioContext.destination);

    staticNode.start();
    staticNode.stop(audioContext.currentTime + durationSeconds);
    staticNode.onended = () => {
      if( FLAG_MINIMAL_AUDIO_CLEANUP ) {
        [panner].map(audioDisconnectSingleNode);
      } else {
        [panner, gain, staticNode, filter].map(audioDisconnectSingleNode);
      }
    }
  }
}