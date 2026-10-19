import type {HandLandmarkerResult} from "@mediapipe/tasks-vision";
import {coordsForMovement} from "./events/cursorHelper.ts";
import {GestureType} from "./types.ts";

let lastSent = 0;

export const handleEvents = (gestureType: GestureType, landmarksDetection: HandLandmarkerResult, cursorRef?: HTMLDivElement | null) => {
    const hand = landmarksDetection.landmarks[0];
    if (!hand) return;

    const coords = coordsForMovement(hand);
    if (!coords) return;

    if (cursorRef) {
        cursorRef.style.transform = `translate(${coords.nx * window.innerWidth}px, ${coords.ny * window.innerHeight}px)`;
        cursorRef.style.background = gestureType === GestureType.CLICK ? "#3b82f6" : "#ff4d4d";
    }

    const now = performance.now();
    if (gestureType !== GestureType.CLICK && now - lastSent < 32) return;
    lastSent = now;

    if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return;

    chrome.runtime.sendMessage({
        type: "GESTURE",
        nx: coords.nx,
        ny: coords.ny,
        gesture: gestureType,
    }).catch(() => {});
};
