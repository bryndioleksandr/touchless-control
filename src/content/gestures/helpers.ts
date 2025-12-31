import type {HandLandmarkerResult, NormalizedLandmark} from "@mediapipe/tasks-vision";

export const FINGER_TIPS = [4, 8, 12, 16, 20];
export const FINGER_PIPS = [2, 6, 10, 14, 18];

export const getDistance = (p1:{x:number, y:number, z?:number}, p2:{x:number, y:number, z?:number}) => {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

export const isFingerDown = (landmarkDetections:  NormalizedLandmark[], fingerIndex:number) => {
    if(fingerIndex === 0){
        return landmarkDetections[4].x < landmarkDetections[3].x;
    }
    const tipIndex = FINGER_TIPS[fingerIndex];
    const pipIndex = FINGER_PIPS[fingerIndex];
    return landmarkDetections[tipIndex].y > landmarkDetections[pipIndex].y;
}
