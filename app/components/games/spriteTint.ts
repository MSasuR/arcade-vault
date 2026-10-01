// Teñido de sprites para los skins neon/retro (spec 10, sección 11 de reference.md).
// Solo se usa dentro de create<Juego> (necesita un canvas offscreen); nunca toca public/.

// Cada píxel opaco se reclasifica por su luminancia relativa a la mediana de la región:
// contorno/sombra → ramp[0], cuerpo → ramp[1], brillo → ramp[2]. Con `quantize` se usan solo
// esos 3 tonos (sin degradado: retro); sin él se interpola y se conserva el sombreado (neon).
// Los colores llegan siempre desde el skins.ts de cada juego.
export interface SpriteTint {
  ramp: [string, string, string];
  quantize: boolean;
  // Textura opcional sobre el cuerpo (retro), para distinguir piezas del mismo tono
  pattern?: "stripes" | "dots";
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const luma = (d: Uint8ClampedArray, i: number) =>
  0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];

// Reclasifica los píxeles opacos de una región según su luminancia relativa a la mediana
export function tintRegion(
  out: CanvasRenderingContext2D,
  r: { sx: number; sy: number; sw: number; sh: number },
  tint: SpriteTint,
  patternColor: string,
  withPattern: boolean,
) {
  const image = out.getImageData(r.sx, r.sy, r.sw, r.sh);
  const d = image.data;
  const lums: number[] = [];
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 0) lums.push(luma(d, i));
  if (lums.length === 0) return;
  lums.sort((a, b) => a - b);
  const median = Math.max(1, lums[Math.floor(lums.length / 2)]);
  const max = Math.max(median + 1, lums[lums.length - 1]);
  const [shade, body, light] = tint.ramp.map(hexToRgb);
  const pattern = hexToRgb(patternColor);

  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const l = luma(d, i);
    let rgb: number[];
    if (tint.quantize) {
      if (l < median * 0.6) rgb = shade;
      else if (l > median + (max - median) * 0.5) rgb = light;
      else rgb = body;
    } else if (l <= median) {
      const t = l / median;
      rgb = shade.map((v, k) => v + (body[k] - v) * t);
    } else {
      const t = (l - median) / (max - median);
      rgb = body.map((v, k) => v + (light[k] - v) * t);
    }
    if (withPattern && tint.pattern && rgb !== shade) {
      const px = (i / 4) % r.sw;
      const py = Math.floor(i / 4 / r.sw);
      const hit =
        tint.pattern === "stripes"
          ? py % 4 === 3 && py < r.sh - 2
          : px % 6 >= 2 && px % 6 <= 3 && py % 6 >= 3 && py % 6 <= 4;
      if (hit) rgb = pattern;
    }
    d[i] = rgb[0];
    d[i + 1] = rgb[1];
    d[i + 2] = rgb[2];
    // Retro sin semitransparencias: bordes duros
    if (tint.quantize) d[i + 3] = d[i + 3] >= 128 ? 255 : 0;
  }
  out.putImageData(image, r.sx, r.sy);
}
