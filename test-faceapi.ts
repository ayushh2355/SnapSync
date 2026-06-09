import * as faceapi from '@vladmandic/face-api';
import { Canvas, Image, ImageData, createCanvas, loadImage } from 'canvas';
import * as path from 'path';

faceapi.env.monkeyPatch({ Canvas, Image, ImageData } as any);

async function run() {
  console.log("Loading models...");
  await faceapi.nets.ssdMobilenetv1.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
  await faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
  await faceapi.nets.faceRecognitionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
  console.log("Models loaded.");

  const canvas = createCanvas(100, 100);
  console.log("Running face detection...");
  try {
    const detections = await faceapi
      .detectAllFaces(canvas as any, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptors();
    console.log("Success! Detections:", detections.length);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
