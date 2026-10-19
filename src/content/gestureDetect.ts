import {FilesetResolver, HandLandmarker, type HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { HAND_CONNECTIONS } from "@mediapipe/hands";
import React from "react";

const MODEL_PATH = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const wasmBase = () => {
    if (typeof chrome !== "undefined" && chrome.runtime?.id) {
        return chrome.runtime.getURL("wasm");
    }
    return "./wasm";
};

export const initHandDetector = async (setIsHandModelLoaded: React.Dispatch<React.SetStateAction<boolean>>) => {
    try {
        const vision = await FilesetResolver.forVisionTasks(wasmBase());
        const create = (delegate: "GPU" | "CPU") => HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: MODEL_PATH,
                delegate,
            },
            numHands: 2,
            runningMode: "VIDEO",
        });

        let handDetector: HandLandmarker;
        try {
            handDetector = await create("GPU");
        } catch (gpuError) {
            console.warn("GPU hand model failed, using CPU", gpuError);
            handDetector = await create("CPU");
        }

        setIsHandModelLoaded(true);
        return handDetector;
    } catch (e) {
        console.error("error is:", e);
        return null;
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
