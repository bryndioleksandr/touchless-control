import type {HandLandmarkerResult, NormalizedLandmark} from "@mediapipe/tasks-vision";
import type {Landmark} from "@mediapipe/hands";

// starting from big finger
export const FINGER_TIPS = [4, 8, 12, 16, 20];
export const FINGER_PIPS = [2, 6, 10, 14, 18];
export const FINGER_JOINTS = [1, 5, 9, 13, 17];

export const getDistance2D = (p1:{x:number, y:number}, p2:{x:number, y:number}) => {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

export const getDistance3D = (p1:{x:number, y:number, z:number}, p2:{x:number, y:number, z:number}) => {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y, p1.z - p2.z);
}

export const isFingerDown = (landmarkDetections:  NormalizedLandmark[], worldLandmarkDetections: Landmark[], fingerIndex:number) => {
    // palm length
    const palmLength = getDistance3D({x: worldLandmarkDetections[9].x, y: worldLandmarkDetections[9].y, z: worldLandmarkDetections[9].z }, {x: worldLandmarkDetections[0].x, y: worldLandmarkDetections[0].y, z: worldLandmarkDetections[0].z });
    const palmWidth = getDistance3D({x: worldLandmarkDetections[5].x, y: worldLandmarkDetections[5].y, z: worldLandmarkDetections[5].z }, {x: worldLandmarkDetections[17].x, y: worldLandmarkDetections[17].y, z: worldLandmarkDetections[17].z });
    const wrist = worldLandmarkDetections[0];
    const tip = worldLandmarkDetections[FINGER_TIPS[fingerIndex]];
    const pip = worldLandmarkDetections[FINGER_PIPS[fingerIndex]];
    //const joint = landmarkDetections[FINGER_JOINTS[fingerIndex]];
    if (fingerIndex === 0) {
        const pinkyMCP = worldLandmarkDetections[17];
        const distanceToPinky = getDistance3D(tip, pinkyMCP);
        const distanceToWrist = getDistance3D(tip, wrist);

        return distanceToPinky < (palmLength * 0.7);
    }

    const tipDistance = getDistance3D(tip, wrist);
    // const jointDistance = getDistance(joint, wrist);
    const pipDistance = getDistance3D(pip, wrist);

    return tipDistance < pipDistance;
}
