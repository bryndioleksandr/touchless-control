import type {NormalizedLandmark} from "@mediapipe/tasks-vision";

export const mapCoordinates = (
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
) => {

    const clampedValue = Math.max(inMin, Math.min(value, inMax));

    const proportion = (clampedValue - inMin) / (inMax - inMin);

    return proportion * (outMax - outMin) + outMin;
};

let prevX = 0;
let prevY = 0;

export const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
};

export const coordsForMovement = (landmarkDetections: NormalizedLandmark[], screenWidth: number, screenHeight: number) => {
    if (!landmarkDetections || landmarkDetections.length === 0) return null;

    const indexTip = landmarkDetections[8];
    const rawX = mapCoordinates(1 - indexTip.x, 0, 1, 0, screenWidth);
    const rawY = mapCoordinates(indexTip.y, 0, 1, 0, screenHeight);

    const smoothX = lerp(prevX, rawX, 0.2);
    const smoothY = lerp(prevY, rawY, 0.5);

    prevX = smoothX;
    prevY = smoothY;
    return {x: smoothX, y: smoothY};
}

