import { type HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { GestureType } from "./types.ts";

export const recognizeGesture = (landmarksDetection: HandLandmarkerResult):GestureType => {
    if (!landmarksDetection.landmarks || landmarksDetection.landmarks.length === 0) return GestureType.IDLE;
    

    return GestureType.IDLE;
}
