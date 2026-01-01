import {type HandLandmarkerResult} from "@mediapipe/tasks-vision";
import {GestureType} from "./types.ts";
import {isFingerDown} from "./helpers.ts";

export const recognizeGesture = (landmarksDetection: HandLandmarkerResult): GestureType => {
    if (!landmarksDetection.landmarks || landmarksDetection.landmarks.length === 0) return GestureType.IDLE;
    // landmarksDetection.landmarks[0] === first hand (can be 2 there)
    const fingerState = [0, 1, 2, 3, 4].map(index => isFingerDown(landmarksDetection.landmarks[0], index));

    const zelenskyGesture = fingerState[0] && !fingerState[1] && !fingerState[2] && fingerState[3] && fingerState[4] && (landmarksDetection.landmarks[0][8].y < landmarksDetection.landmarks[0][7].y) && (landmarksDetection.landmarks[0][12].y < landmarksDetection.landmarks[0][11].y);
    const pointingGesture = fingerState[0] && !fingerState[1] && fingerState[2] && fingerState[3] && fingerState[4];
    const rockNRoll = fingerState[0] && !fingerState[1] && fingerState[2] && fingerState[3] && !fingerState[4];
    const thumbUp = !fingerState[0] && fingerState[1] && fingerState[2] && fingerState[3] && fingerState[4];

    if (zelenskyGesture) return GestureType.ZELENSKY;
    if (pointingGesture) return GestureType.POINTING;
    if (rockNRoll) return GestureType.ROCKNROLL;
    if (thumbUp) return GestureType.THUMB_UP;

    return GestureType.IDLE;
}
