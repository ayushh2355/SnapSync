import sharp from 'sharp';

export class WatermarkService {
  static async applyWatermark(buffer: Buffer, text: string): Promise<Buffer> {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    const width = metadata.width || 800;
    const height = metadata.height || 600;

    const fontSize = Math.floor(width * 0.05);

    const svgText = `
      <svg width="${width}" height="${height}">
        <style>
          .title { fill: rgba(255, 255, 255, 0.5); font-size: ${fontSize}px; font-weight: bold; font-family: sans-serif; }
        </style>
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" class="title">${text}</text>
      </svg>
    `;

    const svgBuffer = Buffer.from(svgText);

    return image
      .composite([{ input: svgBuffer, gravity: 'center' }])
      .toBuffer();
  }
}
