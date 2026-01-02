import {FilesetResolver, HandLandmarker, type HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { HAND_CONNECTIONS } from "@mediapipe/hands";
import React from "react";
import {recognizeGesture} from "./gestures/gestureRecognizer.ts";


export const initHandDetector = async (setIsHandModelLoaded: React.Dispatch<React.SetStateAction<boolean>>) => {
    try {
        console.log('trying to init hands');
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm");
        const handDetector = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                delegate: "GPU"
            },
            numHands: 2,
            runningMode: "VIDEO"
        });
        setIsHandModelLoaded(true);
        if(handDetector !== undefined) return handDetector;
    } catch (e) {
        console.error("error is:", e);
    }
}

export const getHandLandmarks = (handDetector: HandLandmarker, videoRef: HTMLVideoElement, startTimeMs: number): HandLandmarkerResult | null => {
    if(handDetector) {
        return handDetector.detectForVideo(videoRef, startTimeMs);
    }
    return null;
}

export const drawHandSkeleton = (landmarksDetection: HandLandmarkerResult, ctx: CanvasRenderingContext2D) => {
    if (!landmarksDetection.landmarks?.length) return;
    console.log('landmarks:', landmarksDetection);
    // console.log('world landmarks:', landmarksDetection.worldLandmarks);
    const gesture = recognizeGesture(landmarksDetection);
    if(gesture !== "IDLE") console.log('current gesture is', gesture);
    const { width, height } = ctx.canvas;

    ctx.save();

    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const landmarks of landmarksDetection.landmarks) {

        ctx.strokeStyle = "#00FF00";
        ctx.beginPath();

        for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
            const p1 = landmarks[startIdx];
            const p2 = landmarks[endIdx];

            ctx.moveTo(p1.x * width, p1.y * height);
            ctx.lineTo(p2.x * width, p2.y * height);
        }
        ctx.stroke();

        ctx.fillStyle = "#FF0000";
        ctx.beginPath();

        for (const landmark of landmarks) {
            ctx.moveTo((landmark.x * width) + 5, landmark.y * height);
            ctx.arc(landmark.x * width, landmark.y * height, 5, 0, 2 * Math.PI);
        }
        ctx.fill();
    }

    ctx.restore();
}
