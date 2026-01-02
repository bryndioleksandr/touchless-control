import type {GestureType} from "./types.ts";
import type {HandLandmarkerResult} from "@mediapipe/tasks-vision";
import {coordsForMovement} from "./events/cursorHelper.ts";

export const handleEvents = (gestureType: GestureType, landmarksDetection: HandLandmarkerResult, cursorRef:HTMLDivElement) => {
    switch(gestureType) {
        case "POINTING":
            const coords = coordsForMovement(landmarksDetection.landmarks[0], window.innerWidth, window.innerHeight);
            if(coords) {
                console.log('coords are here');
                cursorRef.style.transform = `translate(${coords.x}px,${coords.y}px)`;
            }
            break;
    }
}
