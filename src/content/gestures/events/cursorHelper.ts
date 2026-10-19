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
let hasPrev = false;

export const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
};

export const coordsForMovement = (landmarkDetections: NormalizedLandmark[]) => {
    if (!landmarkDetections || landmarkDetections.length === 0) return null;

    const indexTip = landmarkDetections[8];
    const rawX = mapCoordinates(1 - indexTip.x, 0, 1, 0, 1);
    const rawY = mapCoordinates(indexTip.y, 0, 1, 0, 1);

    if (!hasPrev) {
        prevX = rawX;
        prevY = rawY;
        hasPrev = true;
    } else {
        prevX = lerp(prevX, rawX, 0.4);
        prevY = lerp(prevY, rawY, 0.4);
    }

    return {nx: prevX, ny: prevY};
}

