import {useRef, useState, useEffect} from "react";
import {ObjectDetector, FilesetResolver, HandLandmarker} from "@mediapipe/tasks-vision";
import {initHandDetector, drawHandSkeleton, getHandLandmarks} from "./gestureDetect.ts";
import {coordsForMovement} from "./gestures/events/cursorHelper.ts";
import VirtualCursor from "./gestures/components/VirtualCursor.tsx";
import {recognizeGesture} from "./gestures/gestureRecognizer.ts";
import {handleEvents} from "./gestures/gestureHandler.ts";

let objectDetector: ObjectDetector;
let handDetector: HandLandmarker;
// let video = document.getElementById("video-player") as HTMLVideoElement;
// let videoParent = document.getElementById("video-container") as HTMLDivElement;
// let canvas = document.getElementById("over-video") as HTMLCanvasElement;
// const canvaCtx = canvas.getContext("2d");
let lastVideoTime = -1;


export const FloatingVideo = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);

    const cursorRef = useRef<HTMLDivElement>(null);

    const [error, setError] = useState<string | null>(null);
    const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
    const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
    const [isHandModelLoaded, setIsHandModelLoaded] = useState<boolean>(false);

    const initObjDetector = async () => {
        try {
            const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm");
            objectDetector = await ObjectDetector.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`,
                    delegate: "GPU"
                },
                scoreThreshold: 0.5,
                runningMode: "VIDEO"
            });
            setIsModelLoaded(true);
        } catch (e) {
            console.error("error is:", e);
        }
    }

    useEffect(() => {
        if (!canvasRef.current) return;

        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;

        ctxRef.current = ctx;
    }, [canvasRef, isCameraOn]);

    useEffect(() => {
        initObjDetector();
        const handsWrapper = async() =>
        {
            const tempHands = await initHandDetector(setIsHandModelLoaded);
            if(tempHands) handDetector = tempHands;
        }
        handsWrapper();
    }, []);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false,
                });

                streamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (e) {
                console.error(e);
                setError("Camera permission denied");
            }
        };

        const stopCamera = () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }

            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };


        if (isModelLoaded && isHandModelLoaded) {
            if (isCameraOn) {
                startCamera();
            } else {
                stopCamera();
            }
        }

        return () => {
            stopCamera();
        };
    }, [isCameraOn]);

    // const detectObject = async () => {
    //    let startTimeMs = performance.now();
    //    if(videoRef.current?.currentTime !== lastVideoTime && videoRef.current?.currentTime && objectDetector) {
    //        lastVideoTime = videoRef.current?.currentTime;
    //        const detections = objectDetector.detectForVideo(videoRef.current, startTimeMs);
    //        console.log('detections:', detections);
    //        // call function and send detections to it
    //        displayHighlightedDetections(detections);
    //    }
    //    window.requestAnimationFrame(detectObject);
    // }

    // const displayHighlightedDetections = (detections: ObjectDetectorResult, ctx: CanvasRenderingContext2D) => {
    //     if (!detections.detections || detections.detections.length === 0) return;
    //
    //     ctx.save();
    //     for (const detection of detections.detections) {
    //
    //         if (!detection.boundingBox) continue;
    //
    //         const { originX, originY, width, height } = detection.boundingBox;
    //
    //         ctx.beginPath();
    //         ctx.lineWidth = 4;
    //         ctx.strokeStyle = "#00FF00";
    //         ctx.rect(originX, originY, width, height);
    //         ctx.stroke();
    //
    //         ctx.fillStyle = "rgba(0, 255, 0, 0.1)";
    //         ctx.fill();
    //
    //         if (detection.categories && detection.categories.length > 0) {
    //             const label = `${detections.detections[0].categories[0].categoryName} ${Math.round(detections.detections[0].categories[0].score * 100)}%`;
    //             ctx.save();
    //             ctx.scale(-1, 1);
    //             ctx.fillStyle = "#00FF00";
    //             ctx.font = "16px Arial";
    //             ctx.fillText(label, -originX-width, originY - 10);
    //
    //             ctx.restore();
    //         }
    //     }
    //     ctx.restore();
    // }

    const processFrame = () => {
        if (!videoRef.current || !canvasRef.current || !ctxRef.current || !objectDetector || !handDetector) {
            window.requestAnimationFrame(processFrame);
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        const startTimeMs = performance.now();

        ctx.save();

        if (video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;

           // const objectDetections = objectDetector.detectForVideo(video, startTimeMs);
            const handDetections = getHandLandmarks(handDetector, video, startTimeMs);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

          // displayHighlightedDetections(objectDetections, ctx);

            if (handDetections) {
                drawHandSkeleton(handDetections, ctx);
                const coords = coordsForMovement(handDetections.landmarks[0], window.innerWidth, window.innerHeight);
                //const gesture = recognizeGesture(handDetections);

                // if(cursorRef.current) {
                //   handleEvents(gesture, handDetections, cursorRef.current);
                // }

                if(cursorRef.current && coords) {
                    cursorRef.current.style.transform = `translate(${coords.x}px,${coords.y}px)`;
                }
            }
        }
        ctx.restore();

        window.requestAnimationFrame(processFrame);
    }

    return (
        <div id="video-container" ref={videoContainerRef} className="video-container relative flex flex-col justify-center text-center">
            <h2>Камера</h2>
            <button onClick={() => {
                setIsCameraOn(!isCameraOn)
            }}>
                {isCameraOn ? "Turn the camera off" : "Turn the camera on"}
            </button>
            {error ? (
                <p className="text-red-500">{error}</p>
            ) : (

                isCameraOn ? (
                    <div className="video-container relative w-full max-w-[600px] rounded-[10px] overflow-hidden border border-black mx-auto">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        id="video-player"
                        className="w-full h-auto block -scale-x-100"
                        onLoadedData={() => {
                            if (canvasRef.current && videoRef.current) {
                                canvasRef.current.width = videoRef.current.videoWidth;
                                canvasRef.current.height = videoRef.current.videoHeight;
                            }
                            processFrame();
                        }}
                    />
                        <canvas id="over-video" ref={canvasRef} className="absolute -scale-x-100 top-0 left-0 w-full h-full pointer-events-none"/>
                        <VirtualCursor ref={cursorRef}/>
                    </div>) : null

            )}
        </div>
    )
        ;
}
