import { toJpegUrl } from '@/lib/cloudinaryUrl';

type UserRole = 'admin' | 'photographer' | 'member' | 'viewer';

interface WatermarkParams {
  primaryText: string;
  secondaryText: string | null;
  isTrusted: boolean;
}

function buildWatermarkParams(clubName: string, eventName: string, role: UserRole): WatermarkParams {
  const isTrusted = role === 'admin' || role === 'photographer';
  return {
    primaryText: `${clubName} \u2022 ${eventName}`,
    secondaryText: role === 'viewer' ? '\u00a9 SnapSync \u2014 Unauthorized redistribution prohibited' : null,
    isTrusted,
  };
}

function paintWatermark(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  params: WatermarkParams,
): void {
  const fontSize = Math.max(16, Math.round(canvasWidth * 0.018));
  const lineHeight = Math.round(fontSize * 1.5);
  const padding = Math.max(20, Math.round(canvasWidth * 0.015));
  const alpha = params.isTrusted ? 0.5 : 0.8;

  ctx.save();

  ctx.globalAlpha = alpha;
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';

  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = Math.round(fontSize * 0.6);
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = '#ffffff';

  const x = canvasWidth - padding;

  if (params.secondaryText) {
    ctx.fillText(params.primaryText, x, canvasHeight - padding - lineHeight);
    ctx.fillText(params.secondaryText, x, canvasHeight - padding);
  } else {
    ctx.fillText(params.primaryText, x, canvasHeight - padding);
  }

  ctx.restore();
}

async function fetchBlob(url: string): Promise<Blob> {
  const response = await fetch(url, { mode: 'cors', cache: 'reload' });
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
  }
  return response.blob();
}

async function blobToWatermarkedBlob(imageBlob: Blob, params: WatermarkParams): Promise<Blob> {
  const bitmap = await createImageBitmap(imageBlob);

  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Canvas 2D context unavailable');
  }

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  paintWatermark(ctx, canvas.width, canvas.height, params);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (outputBlob) => {
        if (!outputBlob) {
          reject(new Error('canvas.toBlob returned null'));
          return;
        }
        resolve(outputBlob);
      },
      'image/jpeg',
      0.92,
    );
  });
}

function triggerBlobDownload(blob: Blob, fileName: string): void {
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 10_000);
}

export async function downloadWithWatermark(
  imageUrl: string,
  clubName: string,
  eventName: string,
  userRole: UserRole,
  fileName: string,
): Promise<void> {
  const params = buildWatermarkParams(clubName, eventName, userRole);
  const fetchUrl = toJpegUrl(imageUrl);

  try {
    const imageBlob = await fetchBlob(fetchUrl);
    const watermarkedBlob = await blobToWatermarkedBlob(imageBlob, params);
    triggerBlobDownload(watermarkedBlob, fileName);
  } catch {
    console.warn('[downloadWithWatermark] Canvas watermark failed, downloading without watermark.', imageUrl);
    const anchor = document.createElement('a');
    anchor.href = imageUrl;
    anchor.download = fileName;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }
}
