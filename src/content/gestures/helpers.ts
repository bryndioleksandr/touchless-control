import type {HandLandmarkerResult, NormalizedLandmark} from "@mediapipe/tasks-vision";

// starting from big finger
export const FINGER_TIPS = [4, 8, 12, 16, 20];
export const FINGER_PIPS = [2, 6, 10, 14, 18];
export const FINGER_JOINTS = [1, 5, 9, 13, 17];

export const getDistance = (p1:{x:number, y:number, z?:number}, p2:{x:number, y:number, z?:number}) => {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

export const isFingerDown = (landmarkDetections:  NormalizedLandmark[], fingerIndex:number) => {
    const wrist = landmarkDetections[0];
    const tip = landmarkDetections[FINGER_TIPS[fingerIndex]];
    const joint = landmarkDetections[FINGER_JOINTS[fingerIndex]];
    if (fingerIndex === 0) {
        const pinkyMCP = landmarkDetections[17];
        const distanceToPinky = getDistance(tip, pinkyMCP);
        const distanceToWrist = getDistance(tip, wrist);

        return distanceToPinky < 0.15 || distanceToWrist < 0.25;
    }

    const tipDistance = getDistance(tip, wrist);
    const jointDistance = getDistance(joint, wrist);

    return tipDistance < jointDistance;
}
