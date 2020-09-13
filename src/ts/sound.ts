type SoundEffect3D = (position: Vector3, intensity: number) => void;

const audioDisconnect = (nodes: AudioNode[]) => {
  for( let node of nodes ) {
      if( node ) {
          node.disconnect();
      }
  }
}

const audioDisconnectSingleNode = (node: AudioNode) => {
  if( node ) {
      node.disconnect();
  }
}

let audioContext: ExtendedAudioContext;
const lazySoundEffect = (f: (audioContext: ExtendedAudioContext) => SoundEffect3D): SoundEffect3D => {
  let soundEffect: SoundEffect3D;
  return (position: Vector3, intensity: number) => {
    if (!audioContext) {
      audioContext = shortenMethods(FLAG_CHECK_WEBKIT_AUDIO_CONTEXT && window["webkitAudioContext"]
          ? new window["webkitAudioContext"]()
          : new AudioContext()
      );
    }
    if (!soundEffect) {
      soundEffect = f(audioContext);
    }
    soundEffect(position, intensity);
  }
}

const webAudioBoomSoundEffectFactory = (
  audioContext: ExtendedAudioContext,
  durationSeconds: number,
  attackSeconds: number,
  filterFrequency: number,
  attackVolume: number,
  sustainVolume: number
): SoundEffect3D => {
  const sampleRate = audioContext.sampleRate;
  let frameCount = durationSeconds * sampleRate | 0;
  const buffer: ExtendedAudioBuffer = shortenMethods(audioContext['crBur'](1, frameCount, sampleRate));
  const data = buffer['geChDaa'](0);

  while (frameCount--) {
    data[frameCount] = mathRandom() * 2 - 1;
  }

  return (position: Vector3, volume: number) => {
    // set up the frequency
    if( !volume) {
      volume = 1;
    }

    const staticNode = audioContext['crBuSoe']();
    staticNode.buffer = buffer;
    staticNode.loop = true;

    const filter = audioContext['crBiFir']();
    filter.type = 'lowpass';
    filter.Q.value = 0;
    filter.frequency.value = filterFrequency;

    //decay
    const gain = audioContext['crGan']();
    const decaySeconds = durationSeconds * .2;
    const now = audioContext.currentTime;
    const gainAudioParam: ExtendedAudioParam = shortenMethods(gain.gain);

    gainAudioParam.value = 0;
    gainAudioParam['seVaAtTie'](0, now);
    gainAudioParam['liRaToVaAtTime'](attackVolume, now + attackSeconds);
    gainAudioParam['liRaToVaAtTime'](sustainVolume, now + decaySeconds);
    gainAudioParam['liRaToVaAtTime'](0, now + durationSeconds);


    const panner = audioContext['crPar']();
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
        panner.disconnect();
      } else {
        [panner, gain, staticNode, filter].map(audioDisconnectSingleNode);
      }
    }
  }
}