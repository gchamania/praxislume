import type { VisualAssetGenerationRequest } from '@praxislume/contracts';
import type { LogoAsset } from './visualAssetStore.js';

export type RenderedVisualAsset = {
  bytes: Uint8Array;
  mimeType: 'image/svg+xml';
  width: number;
  height: number;
};

export function renderBrandedPostSvg(input: {
  request: VisualAssetGenerationRequest;
  backgroundBytes: Uint8Array;
  backgroundMimeType: string;
  logo?: LogoAsset;
}): RenderedVisualAsset {
  const width = 1080;
  const height = 1080;
  const backgroundHref = dataUri(input.backgroundBytes, input.backgroundMimeType);
  const logoMarkup = input.logo
    ? `<image href="${dataUri(input.logo.bytes, input.logo.mimeType)}" x="64" y="64" width="116" height="116" preserveAspectRatio="xMidYMid meet"/>`
    : `<circle cx="122" cy="122" r="58" fill="${escapeXml(input.request.brandColors.primary)}" opacity="0.95"/><text x="122" y="134" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff">PL</text>`;

  const titleLines = wrapText(input.request.title, 24).slice(0, 4);
  const disclaimerLines = wrapText(input.request.disclaimer, 70).slice(0, 2);

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    '<defs>',
    '<linearGradient id="shade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.92"/><stop offset="0.58" stop-color="#ffffff" stop-opacity="0.58"/><stop offset="1" stop-color="#ffffff" stop-opacity="0.24"/></linearGradient>',
    '<filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#0B1720" flood-opacity="0.18"/></filter>',
    '</defs>',
    `<image href="${backgroundHref}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>`,
    '<rect width="1080" height="1080" fill="url(#shade)"/>',
    `<rect x="48" y="48" width="984" height="984" rx="38" fill="#ffffff" opacity="0.18" stroke="${escapeXml(input.request.brandColors.primary)}" stroke-opacity="0.18"/>`,
    logoMarkup,
    `<text x="206" y="106" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="${escapeXml(input.request.brandColors.primary)}">${escapeXml(input.request.clinicName)}</text>`,
    `<text x="206" y="150" font-family="Arial, sans-serif" font-size="24" font-weight="500" fill="#31424A">${escapeXml(input.request.doctorName)}</text>`,
    `<g filter="url(#softShadow)"><rect x="74" y="278" width="720" height="${Math.max(270, 98 + titleLines.length * 82)}" rx="8" fill="#ffffff" opacity="0.92"/></g>`,
    ...titleLines.map(
      (line, index) =>
        `<text x="116" y="${366 + index * 82}" font-family="Arial, sans-serif" font-size="68" font-weight="800" fill="#17242A">${escapeXml(line)}</text>`
    ),
    `<rect x="76" y="780" width="628" height="96" rx="8" fill="${escapeXml(input.request.brandColors.primary)}"/>`,
    `<text x="116" y="842" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff">${escapeXml(input.request.shortCta)}</text>`,
    `<rect x="76" y="916" width="920" height="86" rx="8" fill="#ffffff" opacity="0.78"/>`,
    ...disclaimerLines.map(
      (line, index) =>
        `<text x="106" y="${950 + index * 28}" font-family="Arial, sans-serif" font-size="22" font-weight="500" fill="#485860">${escapeXml(line)}</text>`
    ),
    `<circle cx="954" cy="814" r="54" fill="${escapeXml(input.request.brandColors.accent)}" opacity="0.92"/>`,
    '<path d="M932 814h44M954 792v44" stroke="#17242A" stroke-width="10" stroke-linecap="round"/>',
    '</svg>'
  ].join('');

  return {
    bytes: new TextEncoder().encode(svg),
    mimeType: 'image/svg+xml',
    width,
    height
  };
}

function dataUri(bytes: Uint8Array, mimeType: string) {
  return `data:${mimeType};base64,${Buffer.from(bytes).toString('base64')}`;
}

function wrapText(value: string, maxChars: number) {
  const words = value.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [value];
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
