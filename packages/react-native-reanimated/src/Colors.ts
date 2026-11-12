'use strict';
/**
 * Copied from: react-native/Libraries/StyleSheet/normalizeColor.js
 * react-native/Libraries/StyleSheet/processColor.js
 * https://github.com/wcandillon/react-native-redash/blob/master/src/Colors.ts
 */

/* eslint no-bitwise: 0 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSV {
  h: number;
  s: number;
  v: number;
}

function hue2rgb(p: number, q: number, t: number): number {
  'worklet';
  if (t < 0) {
    t += 1;
  }
  if (t > 1) {
    t -= 1;
  }
  if (t < 1 / 6) {
    return p + (q - p) * 6 * t;
  }
  if (t < 1 / 2) {
    return q;
  }
  if (t < 2 / 3) {
    return p + (q - p) * (2 / 3 - t) * 6;
  }
  return p;
}

function hslToRgb(h: number, s: number, l: number): number {
  'worklet';
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = hue2rgb(p, q, h + 1 / 3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1 / 3);

  return (
    (Math.round(r * 255) << 24) |
    (Math.round(g * 255) << 16) |
    (Math.round(b * 255) << 8)
  );
}

function hwbToRgb(h: number, w: number, b: number): number {
  'worklet';
  if (w + b >= 1) {
    const gray = Math.round((w * 255) / (w + b));

    return (gray << 24) | (gray << 16) | (gray << 8);
  }

  const red = hue2rgb(0, 1, h + 1 / 3) * (1 - w - b) + w;
  const green = hue2rgb(0, 1, h) * (1 - w - b) + w;
  const blue = hue2rgb(0, 1, h - 1 / 3) * (1 - w - b) + w;

  return (
    (Math.round(red * 255) << 24) |
    (Math.round(green * 255) << 16) |
    (Math.round(blue * 255) << 8)
  );
}

function parse255(str: string): number {
  'worklet';
  const int = Number.parseInt(str, 10);
  if (int < 0) {
    return 0;
  }
  if (int > 255) {
    return 255;
  }
  return int;
}

function parse360(str: string): number {
  'worklet';
  const int = Number.parseFloat(str);
  return (((int % 360) + 360) % 360) / 360;
}

function parse1(str: string): number {
  'worklet';
  const num = Number.parseFloat(str);
  if (num < 0) {
    return 0;
  }
  if (num > 1) {
    return 255;
  }
  return Math.round(num * 255);
}

function parsePercentage(str: string): number {
  'worklet';
  // parseFloat conveniently ignores the final %
  const int = Number.parseFloat(str);
  if (int < 0) {
    return 0;
  }
  if (int > 100) {
    return 1;
  }
  return int / 100;
}

export function clampRGBA(RGBA: ParsedColorArray): void {
  'worklet';
  for (let i = 0; i < 4; i++) {
    RGBA[i] = Math.max(0, Math.min(RGBA[i], 1));
  }
}

const names: Record<string, number> = {
  transparent: 0x00000000,

  /* spell-checker: disable */
  // http://www.w3.org/TR/css3-color/#svg-color
  aliceblue: 0xf0f8ffff,
  antiquewhite: 0xfaebd7ff,
  aqua: 0x00ffffff,
  aquamarine: 0x7fffd4ff,
  azure: 0xf0ffffff,
  beige: 0xf5f5dcff,
  bisque: 0xffe4c4ff,
  black: 0x000000ff,
  blanchedalmond: 0xffebcdff,
  blue: 0x0000ffff,
  blueviolet: 0x8a2be2ff,
  brown: 0xa52a2aff,
  burlywood: 0xdeb887ff,
  burntsienna: 0xea7e5dff,
  cadetblue: 0x5f9ea0ff,
  chartreuse: 0x7fff00ff,
  chocolate: 0xd2691eff,
  coral: 0xff7f50ff,
  cornflowerblue: 0x6495edff,
  cornsilk: 0xfff8dcff,
  crimson: 0xdc143cff,
  cyan: 0x00ffffff,
  darkblue: 0x00008bff,
  darkcyan: 0x008b8bff,
  darkgoldenrod: 0xb8860bff,
  darkgray: 0xa9a9a9ff,
  darkgreen: 0x006400ff,
  darkgrey: 0xa9a9a9ff,
  darkkhaki: 0xbdb76bff,
  darkmagenta: 0x8b008bff,
  darkolivegreen: 0x556b2fff,
  darkorange: 0xff8c00ff,
  darkorchid: 0x9932ccff,
  darkred: 0x8b0000ff,
  darksalmon: 0xe9967aff,
  darkseagreen: 0x8fbc8fff,
  darkslateblue: 0x483d8bff,
  darkslategray: 0x2f4f4fff,
  darkslategrey: 0x2f4f4fff,
  darkturquoise: 0x00ced1ff,
  darkviolet: 0x9400d3ff,
  deeppink: 0xff1493ff,
  deepskyblue: 0x00bfffff,
  dimgray: 0x696969ff,
  dimgrey: 0x696969ff,
  dodgerblue: 0x1e90ffff,
  firebrick: 0xb22222ff,
  floralwhite: 0xfffaf0ff,
  forestgreen: 0x228b22ff,
  fuchsia: 0xff00ffff,
  gainsboro: 0xdcdcdcff,
  ghostwhite: 0xf8f8ffff,
  gold: 0xffd700ff,
  goldenrod: 0xdaa520ff,
  gray: 0x808080ff,
  green: 0x008000ff,
  greenyellow: 0xadff2fff,
  grey: 0x808080ff,
  honeydew: 0xf0fff0ff,
  hotpink: 0xff69b4ff,
  indianred: 0xcd5c5cff,
  indigo: 0x4b0082ff,
  ivory: 0xfffff0ff,
  khaki: 0xf0e68cff,
  lavender: 0xe6e6faff,
  lavenderblush: 0xfff0f5ff,
  lawngreen: 0x7cfc00ff,
  lemonchiffon: 0xfffacdff,
  lightblue: 0xadd8e6ff,
  lightcoral: 0xf08080ff,
  lightcyan: 0xe0ffffff,
  lightgoldenrodyellow: 0xfafad2ff,
  lightgray: 0xd3d3d3ff,
  lightgreen: 0x90ee90ff,
  lightgrey: 0xd3d3d3ff,
  lightpink: 0xffb6c1ff,
  lightsalmon: 0xffa07aff,
  lightseagreen: 0x20b2aaff,
  lightskyblue: 0x87cefaff,
  lightslategray: 0x778899ff,
  lightslategrey: 0x778899ff,
  lightsteelblue: 0xb0c4deff,
  lightyellow: 0xffffe0ff,
  lime: 0x00ff00ff,
  limegreen: 0x32cd32ff,
  linen: 0xfaf0e6ff,
  magenta: 0xff00ffff,
  maroon: 0x800000ff,
  mediumaquamarine: 0x66cdaaff,
  mediumblue: 0x0000cdff,
  mediumorchid: 0xba55d3ff,
  mediumpurple: 0x9370dbff,
  mediumseagreen: 0x3cb371ff,
  mediumslateblue: 0x7b68eeff,
  mediumspringgreen: 0x00fa9aff,
  mediumturquoise: 0x48d1ccff,
  mediumvioletred: 0xc71585ff,
  midnightblue: 0x191970ff,
  mintcream: 0xf5fffaff,
  mistyrose: 0xffe4e1ff,
  moccasin: 0xffe4b5ff,
  navajowhite: 0xffdeadff,
  navy: 0x000080ff,
  oldlace: 0xfdf5e6ff,
  olive: 0x808000ff,
  olivedrab: 0x6b8e23ff,
  orange: 0xffa500ff,
  orangered: 0xff4500ff,
  orchid: 0xda70d6ff,
  palegoldenrod: 0xeee8aaff,
  palegreen: 0x98fb98ff,
  paleturquoise: 0xafeeeeff,
  palevioletred: 0xdb7093ff,
  papayawhip: 0xffefd5ff,
  peachpuff: 0xffdab9ff,
  peru: 0xcd853fff,
  pink: 0xffc0cbff,
  plum: 0xdda0ddff,
  powderblue: 0xb0e0e6ff,
  purple: 0x800080ff,
  rebeccapurple: 0x663399ff,
  red: 0xff0000ff,
  rosybrown: 0xbc8f8fff,
  royalblue: 0x4169e1ff,
  saddlebrown: 0x8b4513ff,
  salmon: 0xfa8072ff,
  sandybrown: 0xf4a460ff,
  seagreen: 0x2e8b57ff,
  seashell: 0xfff5eeff,
  sienna: 0xa0522dff,
  silver: 0xc0c0c0ff,
  skyblue: 0x87ceebff,
  slateblue: 0x6a5acdff,
  slategray: 0x708090ff,
  slategrey: 0x708090ff,
  snow: 0xfffafaff,
  springgreen: 0x00ff7fff,
  steelblue: 0x4682b4ff,
  tan: 0xd2b48cff,
  teal: 0x008080ff,
  thistle: 0xd8bfd8ff,
  tomato: 0xff6347ff,
  turquoise: 0x40e0d0ff,
  violet: 0xee82eeff,
  wheat: 0xf5deb3ff,
  white: 0xffffffff,
  whitesmoke: 0xf5f5f5ff,
  yellow: 0xffff00ff,
  yellowgreen: 0x9acd32ff,
  /* spell-checker: enable */
};

// copied from react-native/Libraries/Components/View/ReactNativeStyleAttributes
export const ColorProperties = [
  'backgroundColor',
  'borderBottomColor',
  'borderColor',
  'borderLeftColor',
  'borderRightColor',
  'borderTopColor',
  'borderStartColor',
  'borderEndColor',
  'borderBlockColor',
  'borderBlockEndColor',
  'borderBlockStartColor',
  'color',
  'outlineColor',
  'placeholderTextColor',
  'shadowColor',
  'textDecorationColor',
  'tintColor',
  'textShadowColor',
  'overlayColor',
  // SVG color properties
  'fill',
  'floodColor',
  'lightingColor',
  'stopColor',
  'stroke',
];

export function normalizeColor(color: unknown): number | null {
  'worklet';

  if (typeof color === 'number') {
    if (color >>> 0 === color && color >= 0 && color <= 0xffffffff) {
      return color;
    }
    return null;
  }

  if (typeof color !== 'string') {
    return null;
  }

  let inputUntrimmed = color;
  while (inputUntrimmed.includes('  ')) {
    inputUntrimmed = inputUntrimmed.replace('  ', ' ');
  }

  const input = inputUntrimmed.trim();
  if (input.length > 0 && inputUntrimmed[0] === ' ' && input[0] === '#') {
    return null;
  }

  function isAllHexDigits(str: string): boolean {
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      const isHex =
        (c >= '0' && c <= '9') ||
        (c >= 'a' && c <= 'f') ||
        (c >= 'A' && c <= 'F');
      if (!isHex) {
        return false;
      }
    }
    return true;
  }

  function isAllDigits(str: string): boolean {
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if (i === 0 && (c === '-' || c === '+')) {
        continue;
      }

      const isNum = c >= '0' && c <= '9';
      if (!isNum) {
        return false;
      }
    }
    return true;
  }

  function isAllDigitsDot(str: string): boolean {
    const newStr = str.replace('.', ''); // only remove one '.'
    return isAllDigits(newStr);
  }

  function isPercentage(str: string): boolean {
    if (!str.includes('%')) {
      return false;
    }
    const digitDot = str.replace('%', '');
    if (isAllDigitsDot(digitDot)) {
      return true;
    }
    return false;
  }

  if (names[input] !== undefined) {
    return names[input];
  }

  // #RRGGBB => 7 chars total, e.g. "#1a2B3C"
  if (input.startsWith('#') && input.length === 7) {
    const hexPart = input.slice(1); // e.g. "1a2B3C"
    if (isAllHexDigits(hexPart)) {
      return Number.parseInt(hexPart + 'ff', 16) >>> 0;
    }
  }
  // rgb(R, G, B) or rgb(R G B)
  if (input.startsWith('rgb(') && input.endsWith(')')) {
    const inside = input.slice(4, -1).trim();
    let parts = inside.split(',').map((p) => p.trim());

    if (parts.length !== 3) {
      parts = inside.split(' ').map((p) => p.trim());
      if (parts.length !== 3) {
        return null;
      }
    }
    for (const part of parts) {
      if (!isAllDigitsDot(part)) {
        return null;
      }
    }

    const r = parse255(parts[0]);
    const g = parse255(parts[1]);
    const b = parse255(parts[2]);
    if (r != null && g != null && b != null) {
      return ((r << 24) | (g << 16) | (b << 8) | 0xff) >>> 0;
    }
  }

  // rgba(R, G, B, A) or rgba(R G B / A)
  if (input.startsWith('rgba(') && input.endsWith(')')) {
    const inside = input.slice(5, -1).trim();
    if (inside.includes('/')) {
      // slash form
      const [beforeSlash, alphaPart] = inside.split('/');
      if (beforeSlash && alphaPart) {
        const rgbParts = beforeSlash
          .trim()
          .split(' ')
          .map((x) => x.trim());
        if (rgbParts.length === 3) {
          for (const rgbPart of rgbParts) {
            if (!isAllDigitsDot(rgbPart)) {
              return null;
            }
          }
          if (!isAllDigitsDot(alphaPart.trim())) {
            return null;
          }

          const r = parse255(rgbParts[0]);
          const g = parse255(rgbParts[1]);
          const b = parse255(rgbParts[2]);
          const a = parse1(alphaPart.trim());
          if (r != null && g != null && b != null && a != null) {
            return ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
          }
        }
      }
    } else {
      // comma form
      const parts = inside.split(',').map((p) => p.trim());
      if (parts.length === 4) {
        for (const part of parts) {
          if (!isAllDigitsDot(part)) {
            return null;
          }
        }
        const r = parse255(parts[0]);
        const g = parse255(parts[1]);
        const b = parse255(parts[2]);
        const a = parse1(parts[3]);
        if (r != null && g != null && b != null && a != null) {
          return ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
        }
      }
    }
  }

  // #RGB => length=4, e.g. "#F0c"
  if (input.startsWith('#') && input.length === 4) {
    const shortHex = input.slice(1); // e.g. "F0c"
    if (shortHex.length === 3 && isAllHexDigits(shortHex)) {
      // Expand => "FF00cc" + "ff"
      const expanded =
        shortHex[0] +
        shortHex[0] +
        shortHex[1] +
        shortHex[1] +
        shortHex[2] +
        shortHex[2] +
        'ff';
      return Number.parseInt(expanded, 16) >>> 0;
    }
  }

  // #RRGGBBAA => length=9
  if (input.startsWith('#') && input.length === 9) {
    const hexPart = input.slice(1); // e.g. "1a2b3cFF"
    if (hexPart.length === 8 && isAllHexDigits(hexPart)) {
      return Number.parseInt(hexPart, 16) >>> 0;
    }
  }

  // #RGBA => length=5
  if (input.startsWith('#') && input.length === 5) {
    const shortHex = input.slice(1); // e.g. "F0cF"
    if (shortHex.length === 4 && isAllHexDigits(shortHex)) {
      const expanded =
        shortHex[0] +
        shortHex[0] +
        shortHex[1] +
        shortHex[1] +
        shortHex[2] +
        shortHex[2] +
        shortHex[3] +
        shortHex[3];
      return Number.parseInt(expanded, 16) >>> 0;
    }
  }

  // hsl(H, S%, L%) or hsl(H S% L%)
  if (input.startsWith('hsl(') && input.endsWith(')')) {
    const inside = input.slice(4, -1).trim();
    let parts = inside.split(',').map((p) => p.trim());

    if (parts.length !== 3) {
      parts = inside.split(' ').map((p) => p.trim());
      if (parts.length !== 3) {
        return null;
      }
    }
    if (!isAllDigitsDot(parts[0])) {
      return null;
    }
    if (!isPercentage(parts[1])) {
      return null;
    }
    if (!isPercentage(parts[2])) {
      return null;
    }

    const h = parse360(parts[0]); // can be negative, wraps via mod
    const s = parsePercentage(parts[1]);
    const l = parsePercentage(parts[2]);
    if (h != null && s != null && l != null) {
      const rgb = hslToRgb(h, s, l);
      return (rgb | 0xff) >>> 0; // alpha=255
    }
  }

  // hsla(H, S%, L%, A) or hsla(H S% L% / A)
  if (input.startsWith('hsla(') && input.endsWith(')')) {
    const inside = input.slice(5, -1).trim();
    if (inside.includes('/')) {
      // slash form => "H, S%, L% / A"
      const [beforeSlash, alphaPart] = inside.split('/');
      if (beforeSlash && alphaPart) {
        const hslParts = beforeSlash
          .trim()
          .split(' ')
          .map((p) => p.trim());
        if (hslParts.length === 3) {
          if (!isAllDigitsDot(hslParts[0])) {
            return null;
          }
          if (!isPercentage(hslParts[1])) {
            return null;
          }
          if (!isPercentage(hslParts[2])) {
            return null;
          }
          if (!isAllDigitsDot(alphaPart.trim())) {
            return null;
          }

          const h = parse360(hslParts[0]);
          const s = parsePercentage(hslParts[1]);
          const l = parsePercentage(hslParts[2]);
          const a = parse1(alphaPart.trim());
          if (h != null && s != null && l != null && a != null) {
            const rgb = hslToRgb(h, s, l);
            return (rgb | a) >>> 0;
          }
        }
      }
    } else {
      // comma form => "H, S%, L%, A"
      const parts = inside.split(',').map((p) => p.trim());
      if (parts.length === 4) {
        if (!isAllDigitsDot(parts[0])) {
          return null;
        }
        if (!isPercentage(parts[1])) {
          return null;
        }
        if (!isPercentage(parts[2])) {
          return null;
        }
        if (!isAllDigitsDot(parts[3])) {
          return null;
        }

        const h = parse360(parts[0]);
        const s = parsePercentage(parts[1]);
        const l = parsePercentage(parts[2]);
        const a = parse1(parts[3]);
        if (h != null && s != null && l != null && a != null) {
          const rgb = hslToRgb(h, s, l);
          return (rgb | a) >>> 0;
        }
      }
    }
  }

  // hwb(H, W%, B%) or hwb(H W% B%) -- angle can be negative
  if (input.startsWith('hwb(') && input.endsWith(')')) {
    const inside = input.slice(4, -1).trim();
    let parts = inside.split(',').map((p) => p.trim());

    if (parts.length !== 3) {
      parts = inside.split(' ').map((p) => p.trim());
      if (parts.length !== 3) {
        return null;
      }
    }
    if (!isAllDigitsDot(parts[0])) {
      return null;
    }
    if (!isPercentage(parts[1])) {
      return null;
    }
    if (!isPercentage(parts[2])) {
      return null;
    }

    const h = parse360(parts[0]);
    const w = parsePercentage(parts[1]);
    const b = parsePercentage(parts[2]);
    if (h != null && w != null && b != null) {
      const rgb = hwbToRgb(h, w, b);
      return (rgb | 0xff) >>> 0; // alpha=255
    }
  }

  // Nothing matched => invalid
  return null;
}

export const opacity = (c: number): number => {
  'worklet';
  return ((c >> 24) & 255) / 255;
};

export const red = (c: number): number => {
  'worklet';
  return (c >> 16) & 255;
};

export const green = (c: number): number => {
  'worklet';
  return (c >> 8) & 255;
};

export const blue = (c: number): number => {
  'worklet';
  return c & 255;
};

export const rgbaColor = (
  r: number,
  g: number,
  b: number,
  alpha = 1
): number | string => {
  'worklet';
  // Round alpha to 3 decimal places to avoid floating point precision issues
  const safeAlpha = Math.round(alpha * 1000) / 1000;
  return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
};

/**
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns `{h: hue (0-1), s: saturation (0-1), v: value (0-1)}`
 */
export function RGBtoHSV(r: number, g: number, b: number): HSV {
  'worklet';
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  const v = max / 255;

  let h = 0;

  switch (max) {
    case min:
      break;
    case r:
      h = g - b + d * (g < b ? 6 : 0);
      h /= 6 * d;
      break;
    case g:
      h = b - r + d * 2;
      h /= 6 * d;
      break;
    case b:
      h = r - g + d * 4;
      h /= 6 * d;
      break;
  }

  return { h, s, v };
}

/**
 * @param h - Hue (0-1)
 * @param s - Saturation (0-1)
 * @param v - Value (0-1)
 * @returns `{r: red (0-255), g: green (0-255), b: blue (0-255)}`
 */
function HSVtoRGB(h: number, s: number, v: number): RGB {
  'worklet';
  let r, g, b;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch ((i % 6) as 0 | 1 | 2 | 3 | 4 | 5) {
    case 0:
      [r, g, b] = [v, t, p];
      break;
    case 1:
      [r, g, b] = [q, v, p];
      break;
    case 2:
      [r, g, b] = [p, v, t];
      break;
    case 3:
      [r, g, b] = [p, q, v];
      break;
    case 4:
      [r, g, b] = [t, p, v];
      break;
    case 5:
      [r, g, b] = [v, p, q];
      break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export const hsvToColor = (
  h: number,
  s: number,
  v: number,
  a: number
): number | string => {
  'worklet';
  const { r, g, b } = HSVtoRGB(h, s, v);
  return rgbaColor(r, g, b, a);
};

export function processColorInitially(color: unknown): number | null {
  'worklet';
  if (color === null || color === undefined) {
    return null;
  }

  let colorNumber: number;

  if (typeof color === 'number') {
    colorNumber = color;
  } else {
    const normalizedColor = normalizeColor(color);

    if (typeof normalizedColor !== 'number') {
      return normalizedColor;
    }

    colorNumber = normalizedColor;
  }

  return ((colorNumber << 24) | (colorNumber >>> 8)) >>> 0; // alpha rgb
}

export function isColor(value: unknown): value is string {
  'worklet';
  if (typeof value !== 'string') {
    return false;
  }
  const processedColor = processColorInitially(value);
  return processedColor !== undefined && processedColor !== null;
}

export type ParsedColorArray = [number, number, number, number];

export function convertToRGBA(color: unknown): ParsedColorArray {
  'worklet';
  const processedColor = processColorInitially(color) as number; // alpha rgb;
  const a = (processedColor >>> 24) / 255;
  const r = ((processedColor << 8) >>> 24) / 255;
  const g = ((processedColor << 16) >>> 24) / 255;
  const b = ((processedColor << 24) >>> 24) / 255;
  return [r, g, b, a];
}

export function rgbaArrayToRGBAColor(RGBA: ParsedColorArray): string {
  'worklet';
  const alpha = RGBA[3] < 0.001 ? 0 : RGBA[3];
  return `rgba(${Math.round(RGBA[0] * 255)}, ${Math.round(
    RGBA[1] * 255
  )}, ${Math.round(RGBA[2] * 255)}, ${alpha})`;
}

export function toLinearSpace(
  RGBA: ParsedColorArray,
  gamma = 2.2
): ParsedColorArray {
  'worklet';
  const res = [];
  for (let i = 0; i < 3; ++i) {
    res.push(Math.pow(RGBA[i], gamma));
  }
  res.push(RGBA[3]);
  return res as ParsedColorArray;
}

export function toGammaSpace(
  RGBA: ParsedColorArray,
  gamma = 2.2
): ParsedColorArray {
  'worklet';
  const res = [];
  for (let i = 0; i < 3; ++i) {
    res.push(Math.pow(RGBA[i], 1 / gamma));
  }
  res.push(RGBA[3]);
  return res as ParsedColorArray;
}
