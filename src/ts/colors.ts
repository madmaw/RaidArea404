const COLOR_WOOD_DARK: Vector4 = [.4, .3, .2, 1];
const COLOR_WOOD_LIGHT: Vector4 = [.3, .2, .1, 1];
const COLOR_METAL: Vector4 = [.35, .4, .4, 1];
const COLOR_METAL_RED: Vector4 = [.6, .4, .4, 1];
const COLOR_METAL_GREEN: Vector4 = [.4, .6, .4, 1];
const COLOR_GREY: Vector4 = [.4, .4, .4, 1];
const COLOR_OFF_WHITE: Vector4 = [.55, .6, .6, 1];
const COLOR_OFFER_WHITE: Vector4 = [.4, .5, .5, 1];
const COLOR_WHITE: Vector4 = [.7, .7, .7, 1];
const COLOR_BLACK: Vector4 = [0, 0, .1, 1];
const COLOR_WALL: Vector4 = [.4, .4, .6, 1];
const COLOR_TRANSLUCENT_DARK: Vector4 = [0, 0, 0, .5];
const COLOR_TRANSLUCENT_LIGHT: Vector4 = [.5, .5, 1, .2];
const COLOR_GREEN: Vector4 = [0, 1, 0, 1];
const COLOR_RED: Vector4 = [1, 0, 0, 1];
const COLOR_ROYAL_BLUE: Vector4 = [.1, .1, .2, 1];
const COLOR_SKY_BLUE: Vector4 = [.4, .4, .5, 1];

const convertHSLtoRGB = (h: number, s: number, l: number): Vector4 => {
  if (s) {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < .2) return p + (q - p) * 6 * t;
      if (t < .5) return q;
      if (t < .7) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < .5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [
      hue2rgb(p, q, h + 1 / 3),
      hue2rgb(p, q, h),
      hue2rgb(p, q, h - 1 / 3),
      1,
    ];
  }
  return [l, l, l, 1];
}
