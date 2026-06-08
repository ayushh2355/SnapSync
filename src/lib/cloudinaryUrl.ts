function injectCloudinaryTransformation(url: string, transformation: string): string {
  if (!url.includes('res.cloudinary.com')) return url;

  const uploadMarker = '/image/upload/';
  const idx = url.indexOf(uploadMarker);
  if (idx === -1) return url;

  const base = url.slice(0, idx + uploadMarker.length);
  const rest = url.slice(idx + uploadMarker.length);

  return `${base}${transformation}/${rest}`;
}

export function toDisplayUrl(url: string): string {
  return injectCloudinaryTransformation(url, 'f_auto,q_auto');
}

export function toJpegUrl(url: string): string {
  return injectCloudinaryTransformation(url, 'f_jpg,q_auto');
}
