import sharp from 'sharp';

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export class WatermarkService {
  static async applyWatermark(buffer: Buffer, text: string): Promise<Buffer> {
    const image = sharp(buffer);
    const { width = 800, height = 600 } = await image.metadata();

    const fontSize = Math.max(Math.floor(width * 0.05), 12);
    const safeText = escapeXml(text);

    const svgBuffer = Buffer.from(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <text
          x="50%"
          y="50%"
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="${fontSize}"
          font-weight="bold"
          font-family="sans-serif"
          fill="rgba(255,255,255,0.5)"
        >${safeText}</text>
      </svg>
    `);

    return image
      .composite([{ input: svgBuffer, gravity: 'center' }])
      .jpeg()
      .toBuffer();
  }
}
