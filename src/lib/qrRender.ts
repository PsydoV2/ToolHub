/** Custom module-level QR renderer. The `qrcode` package only ships fixed
 * square-module output, so styled dots/finder patterns and the center/badge
 * overlays are drawn by hand from the raw matrix onto canvas or SVG. */

import QRCode from "qrcode";

export type ShapeStyle = "circle" | "rounded" | "square";

export interface QrStyle {
  dotShape: ShapeStyle;
  finderOuterShape: ShapeStyle;
  finderInnerShape: ShapeStyle;
  dotColor: string;
  bgColor: string;
  finderBorderColor: string;
  finderDotColor: string;
  errorCorrectionLevel: "L" | "M" | "Q" | "H";
}

export interface QrOverlay {
  overlayText: string;
  logoUrl: string | null;
  badgeLabel: string;
  badgeColor: string;
  badgeCornerShape: ShapeStyle;
}

export interface QrMatrix {
  size: number;
  data: Uint8Array;
  version: number;
}

const MARGIN = 3;
const BADGE_STRIP_RATIO = 0.16;

export function buildMatrix(
  text: string,
  errorCorrectionLevel: QrStyle["errorCorrectionLevel"],
): QrMatrix {
  const qr = QRCode.create(text, { errorCorrectionLevel });
  return {
    size: qr.modules.size,
    data: qr.modules.data as unknown as Uint8Array,
    version: qr.version,
  };
}

function isFinderZone(row: number, col: number, size: number): boolean {
  const topRow = row < 7;
  const bottomRow = row >= size - 7;
  const leftCol = col < 7;
  const rightCol = col >= size - 7;
  return (topRow && leftCol) || (topRow && rightCol) || (bottomRow && leftCol);
}

function finderOrigins(size: number) {
  return [
    { r: 0, c: 0 },
    { r: 0, c: size - 7 },
    { r: size - 7, c: 0 },
  ];
}

/** Port of `qrcode`'s internal alignment-pattern math (not part of its
 * public API) — needed so alignment patterns can be excluded from regular
 * dot styling and drawn as solid squares, the same as real QR renderers do.
 * Breaking them into loose dots defeats the decoder's perspective correction
 * for version ≥ 2 codes and silently makes the code unscannable. */
function alignmentPatternCenters(version: number): number[][] {
  if (version === 1) return [];
  const size = version * 4 + 17;
  const posCount = Math.floor(version / 7) + 2;
  const intervals = size === 145 ? 26 : Math.ceil((size - 13) / (2 * posCount - 2)) * 2;
  const positions = [size - 7];
  for (let i = 1; i < posCount - 1; i++) {
    positions[i] = positions[i - 1] - intervals;
  }
  positions.push(6);
  positions.reverse();

  const coords: number[][] = [];
  const len = positions.length;
  for (let i = 0; i < len; i++) {
    for (let j = 0; j < len; j++) {
      const isFinderCorner =
        (i === 0 && j === 0) || (i === 0 && j === len - 1) || (i === len - 1 && j === 0);
      if (isFinderCorner) continue;
      coords.push([positions[i], positions[j]]);
    }
  }
  return coords;
}

function alignmentOrigins(version: number) {
  return alignmentPatternCenters(version).map(([r, c]) => ({ r: r - 2, c: c - 2 }));
}

function isAlignmentZone(row: number, col: number, origins: { r: number; c: number }[]): boolean {
  return origins.some(({ r, c }) => row >= r && row < r + 5 && col >= c && col < c + 5);
}

/** Square dots must stay edge-to-edge like a classic QR code — any gap
 * between adjacent dark modules fragments what should read as one solid
 * run, which some decoders (verified against jsQR) fail to grid-align on
 * for certain versions. Circle/rounded dots get visible spacing since
 * that's the point of choosing them, and can afford it. */
function dotPadRatio(shape: ShapeStyle): number {
  return shape === "square" ? 0.02 : 0.08;
}

/** Perceived brightness (ITU-R BT.601), 0-255. Decoders binarize on
 * luminance, not hue — a bright accent color used as a "dark" module color
 * can read as background and break scanning, especially in the smaller
 * finder/alignment cores of higher-version codes. Used to warn users before
 * they ship an unscannable code, not to reject any color outright. */
export function perceivedBrightness(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return (r * 299 + g * 587 + b * 114) / 1000;
}

export const SCAN_RISK_BRIGHTNESS_THRESHOLD = 140;

function canvasShape(
  ctx: CanvasRenderingContext2D,
  shape: ShapeStyle,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  if (shape === "circle") {
    ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
  } else if (shape === "rounded") {
    canvasRoundRect(ctx, x, y, w, h, Math.min(w, h) * 0.32);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.fill();
}

function canvasRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function renderQrToCanvas(
  canvas: HTMLCanvasElement,
  matrix: QrMatrix,
  style: QrStyle,
  overlay: QrOverlay,
  logoImg: HTMLImageElement | null,
  pixelSize: number,
) {
  const { size, data, version } = matrix;
  const hasBadge = overlay.badgeLabel.trim().length > 0;
  const badgeStrip = hasBadge ? pixelSize * BADGE_STRIP_RATIO : 0;
  const alignOrigins = alignmentOrigins(version);

  canvas.width = pixelSize;
  canvas.height = pixelSize + badgeStrip;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = style.bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const total = size + MARGIN * 2;
  const cell = pixelSize / total;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!data[row * size + col]) continue;
      if (isFinderZone(row, col, size)) continue;
      if (isAlignmentZone(row, col, alignOrigins)) continue;
      const pad = cell * dotPadRatio(style.dotShape);
      const x = (col + MARGIN) * cell + pad;
      const y = (row + MARGIN) * cell + pad;
      canvasShape(ctx, style.dotShape, x, y, cell - pad * 2, cell - pad * 2, style.dotColor);
    }
  }

  for (const { r, c } of finderOrigins(size)) {
    const ox = (c + MARGIN) * cell;
    const oy = (r + MARGIN) * cell;
    const outer = 7 * cell;
    canvasShape(ctx, style.finderOuterShape, ox, oy, outer, outer, style.finderBorderColor);
    canvasShape(
      ctx,
      style.finderOuterShape,
      ox + cell,
      oy + cell,
      outer - cell * 2,
      outer - cell * 2,
      style.bgColor,
    );
    canvasShape(
      ctx,
      style.finderInnerShape,
      ox + cell * 2,
      oy + cell * 2,
      outer - cell * 4,
      outer - cell * 4,
      style.finderDotColor,
    );
  }

  // Colored like regular data dots, not the finder eyes: the alignment
  // pattern's center is only a single module, too small a target to
  // reliably read back as "dark" if it were painted in a light accent
  // color the way the large finder cores can get away with.
  for (const { r, c } of alignOrigins) {
    const ox = (c + MARGIN) * cell;
    const oy = (r + MARGIN) * cell;
    const outer = 5 * cell;
    canvasShape(ctx, style.dotShape, ox, oy, outer, outer, style.dotColor);
    canvasShape(
      ctx,
      style.dotShape,
      ox + cell,
      oy + cell,
      outer - cell * 2,
      outer - cell * 2,
      style.bgColor,
    );
    canvasShape(
      ctx,
      style.dotShape,
      ox + cell * 2,
      oy + cell * 2,
      outer - cell * 4,
      outer - cell * 4,
      style.dotColor,
    );
  }

  const hasOverlay = logoImg || overlay.overlayText.trim();
  if (hasOverlay) {
    const boxSize = pixelSize * (logoImg && overlay.overlayText.trim() ? 0.28 : 0.22);
    const bx = (pixelSize - boxSize) / 2;
    const by = (pixelSize - boxSize) / 2;
    ctx.beginPath();
    canvasRoundRect(ctx, bx, by, boxSize, boxSize, boxSize * 0.18);
    ctx.fillStyle = style.bgColor;
    ctx.fill();

    let contentTop = by + boxSize * 0.12;
    if (logoImg) {
      const logoH = boxSize * (overlay.overlayText.trim() ? 0.42 : 0.76);
      const logoW = boxSize * 0.76;
      ctx.drawImage(logoImg, bx + (boxSize - logoW) / 2, contentTop, logoW, logoH);
      contentTop += logoH + boxSize * 0.08;
    }
    if (overlay.overlayText.trim()) {
      ctx.fillStyle = style.dotColor;
      ctx.font = `700 ${Math.round(boxSize * 0.15)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(overlay.overlayText.toUpperCase(), pixelSize / 2, contentTop, boxSize * 0.9);
    }
  }

  if (hasBadge) {
    const label = overlay.badgeLabel.trim();
    const badgeH = badgeStrip * 0.7;
    ctx.font = `700 ${Math.round(badgeH * 0.5)}px system-ui, sans-serif`;
    const textW = ctx.measureText(label).width;
    const badgeW = Math.max(textW + badgeH * 1.1, badgeH * 1.8);
    const bx = (pixelSize - badgeW) / 2;
    const by = pixelSize + (badgeStrip - badgeH) / 2;
    const r =
      overlay.badgeCornerShape === "square"
        ? 0
        : overlay.badgeCornerShape === "circle"
          ? badgeH / 2
          : badgeH * 0.28;
    ctx.beginPath();
    canvasRoundRect(ctx, bx, by, badgeW, badgeH, r);
    ctx.fillStyle = overlay.badgeColor;
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, pixelSize / 2, by + badgeH / 2, badgeW * 0.92);
  }
}

function svgShape(
  shape: ShapeStyle,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
): string {
  if (shape === "circle") {
    const r = Math.min(w, h) / 2;
    return `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${r}" fill="${fill}"/>`;
  }
  if (shape === "rounded") {
    const r = Math.min(w, h) * 0.32;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="${fill}"/>`;
  }
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
}

export function renderQrToSvg(
  matrix: QrMatrix,
  style: QrStyle,
  overlay: QrOverlay,
  logoUrl: string | null,
  pixelSize: number,
): string {
  const { size, data, version } = matrix;
  const hasBadge = overlay.badgeLabel.trim().length > 0;
  const badgeStrip = hasBadge ? pixelSize * BADGE_STRIP_RATIO : 0;
  const width = pixelSize;
  const height = pixelSize + badgeStrip;
  const alignOrigins = alignmentOrigins(version);

  const total = size + MARGIN * 2;
  const cell = pixelSize / total;
  const parts: string[] = [];

  parts.push(`<rect x="0" y="0" width="${width}" height="${height}" fill="${style.bgColor}"/>`);

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!data[row * size + col]) continue;
      if (isFinderZone(row, col, size)) continue;
      if (isAlignmentZone(row, col, alignOrigins)) continue;
      const pad = cell * dotPadRatio(style.dotShape);
      const x = (col + MARGIN) * cell + pad;
      const y = (row + MARGIN) * cell + pad;
      parts.push(svgShape(style.dotShape, x, y, cell - pad * 2, cell - pad * 2, style.dotColor));
    }
  }

  for (const { r, c } of finderOrigins(size)) {
    const ox = (c + MARGIN) * cell;
    const oy = (r + MARGIN) * cell;
    const outer = 7 * cell;
    parts.push(svgShape(style.finderOuterShape, ox, oy, outer, outer, style.finderBorderColor));
    parts.push(
      svgShape(
        style.finderOuterShape,
        ox + cell,
        oy + cell,
        outer - cell * 2,
        outer - cell * 2,
        style.bgColor,
      ),
    );
    parts.push(
      svgShape(
        style.finderInnerShape,
        ox + cell * 2,
        oy + cell * 2,
        outer - cell * 4,
        outer - cell * 4,
        style.finderDotColor,
      ),
    );
  }

  for (const { r, c } of alignOrigins) {
    const ox = (c + MARGIN) * cell;
    const oy = (r + MARGIN) * cell;
    const outer = 5 * cell;
    parts.push(svgShape(style.dotShape, ox, oy, outer, outer, style.dotColor));
    parts.push(
      svgShape(
        style.dotShape,
        ox + cell,
        oy + cell,
        outer - cell * 2,
        outer - cell * 2,
        style.bgColor,
      ),
    );
    parts.push(
      svgShape(
        style.dotShape,
        ox + cell * 2,
        oy + cell * 2,
        outer - cell * 4,
        outer - cell * 4,
        style.dotColor,
      ),
    );
  }

  const hasOverlay = logoUrl || overlay.overlayText.trim();
  if (hasOverlay) {
    const boxSize = pixelSize * (logoUrl && overlay.overlayText.trim() ? 0.28 : 0.22);
    const bx = (pixelSize - boxSize) / 2;
    const by = (pixelSize - boxSize) / 2;
    parts.push(
      `<rect x="${bx}" y="${by}" width="${boxSize}" height="${boxSize}" rx="${boxSize * 0.18}" ry="${boxSize * 0.18}" fill="${style.bgColor}"/>`,
    );

    let contentTop = by + boxSize * 0.12;
    if (logoUrl) {
      const logoH = boxSize * (overlay.overlayText.trim() ? 0.42 : 0.76);
      const logoW = boxSize * 0.76;
      parts.push(
        `<image x="${bx + (boxSize - logoW) / 2}" y="${contentTop}" width="${logoW}" height="${logoH}" href="${logoUrl}" xlink:href="${logoUrl}" preserveAspectRatio="xMidYMid slice"/>`,
      );
      contentTop += logoH + boxSize * 0.08;
    }
    if (overlay.overlayText.trim()) {
      const fontSize = Math.round(boxSize * 0.15);
      parts.push(
        `<text x="${pixelSize / 2}" y="${contentTop + fontSize}" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="700" font-size="${fontSize}" fill="${style.dotColor}">${escapeXml(overlay.overlayText.toUpperCase())}</text>`,
      );
    }
  }

  if (hasBadge) {
    const label = overlay.badgeLabel.trim();
    const badgeH = badgeStrip * 0.7;
    const approxCharW = badgeH * 0.32;
    const badgeW = Math.max(label.length * approxCharW + badgeH * 1.1, badgeH * 1.8);
    const bx = (pixelSize - badgeW) / 2;
    const by = pixelSize + (badgeStrip - badgeH) / 2;
    const r =
      overlay.badgeCornerShape === "square"
        ? 0
        : overlay.badgeCornerShape === "circle"
          ? badgeH / 2
          : badgeH * 0.28;
    parts.push(
      `<rect x="${bx}" y="${by}" width="${badgeW}" height="${badgeH}" rx="${r}" ry="${r}" fill="${overlay.badgeColor}"/>`,
    );
    parts.push(
      `<text x="${pixelSize / 2}" y="${by + badgeH / 2}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, sans-serif" font-weight="700" font-size="${Math.round(badgeH * 0.5)}" fill="#ffffff">${escapeXml(label)}</text>`,
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join("")}</svg>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
