import { Buffer } from 'node:buffer';
import { Resvg } from '@resvg/resvg-js';

export type RenderedPngAsset = {
  bytes: Uint8Array;
  mimeType: 'image/png';
  width: number;
  height: number;
};

export function renderSvgToPng(input: {
  svgBytes: Uint8Array;
  width: number;
  height: number;
}): RenderedPngAsset {
  const resvg = new Resvg(Buffer.from(input.svgBytes), {
    fitTo: {
      mode: 'width',
      value: input.width
    }
  });
  const png = resvg.render();
  return {
    bytes: png.asPng(),
    mimeType: 'image/png',
    width: input.width,
    height: input.height
  };
}
