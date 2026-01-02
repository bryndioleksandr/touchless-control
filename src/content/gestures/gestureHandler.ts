import type {GestureType} from "./types.ts";
import type {HandLandmarkerResult} from "@mediapipe/tasks-vision";
import {coordsForMovement} from "./events/cursorHelper.ts";
import {getDistance2D} from "./helpers.ts";

export const handleEvents = (gestureType: GestureType, landmarksDetection: HandLandmarkerResult, cursorRef: HTMLDivElement) => {
    const coords = coordsForMovement(landmarksDetection.landmarks[0], window.innerWidth, window.innerHeight);
    if (coords) {
        console.log('coords are here');
        cursorRef.style.transform = `translate(${coords.x}px,${coords.y}px)`;

        switch (gestureType) {
            case "POINTING":

                break;
            case "CLICK":
                console.log('Clicking at:', coords.x, coords.y);

                cursorRef.style.background = "blue";
                const elementUnderCursor = document.elementFromPoint(coords.x, coords.y);

                if (elementUnderCursor) {
                    if (elementUnderCursor instanceof HTMLElement) {
                        elementUnderCursor.click();
                        elementUnderCursor.focus();
                        cursorRef.style.background = "ff4d4d";
                    }
                    break;
                }
        }
    }
}
