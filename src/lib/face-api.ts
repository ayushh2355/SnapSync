const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
let modelsLoaded = false;
let faceapiCache: any = null;

async function getFaceApi() {
  if (typeof window === 'undefined') return null;
  if (!faceapiCache) {
    faceapiCache = await import('@vladmandic/face-api');
  }
  return faceapiCache;
}

/**
 * Loads face-api.js models from CDN.
 */
export async function loadModels() {
  const faceapi = await getFaceApi();
  if (!faceapi) return false;
  if (modelsLoaded) return true;
  try {
    console.log('Loading face-api.js models from CDN...');
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    modelsLoaded = true;
    console.log('face-api.js models loaded successfully.');
    return true;
  } catch (err: any) {
    console.error('Failed to load face-api.js models:', err.message);
    throw err;
  }
}

/**
 * Detects all faces in an HTML Image or Video element and returns their boxes and descriptors.
 */
export async function detectAllFaces(element: HTMLImageElement | HTMLCanvasElement) {
  const faceapi = await getFaceApi();
  if (!faceapi) return [];
  await loadModels();
  try {
    const detections = await faceapi
      .detectAllFaces(element, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    return detections.map((det: any) => {
      const { x, y, width, height } = det.detection.box;
      return {
        box: { x, y, width, height },
        descriptor: Array.from(det.descriptor)
      };
    });
  } catch (err: any) {
    console.error('Error during face detection:', err.message);
    return [];
  }
}

/**
 * Detects a single face (for selfie registration) and returns its descriptor.
 */
export async function detectSingleFaceDescriptor(element: HTMLImageElement | HTMLCanvasElement): Promise<number[] | null> {
  const faceapi = await getFaceApi();
  if (!faceapi) return null;
  await loadModels();
  try {
    const detection = await faceapi
      .detectSingleFace(element, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) return null;
    return Array.from(detection.descriptor);
  } catch (err: any) {
    console.error('Error during single face detection:', err.message);
    return null;
  }
}
