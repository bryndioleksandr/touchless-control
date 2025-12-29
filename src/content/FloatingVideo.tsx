import {useRef, useState, useEffect} from "react";
import {ObjectDetector, FilesetResolver, ObjectDetectorResult} from "@mediapipe/tasks-vision";

type RunningMode = "IMAGE" | "VIDEO"

let objectDetector: ObjectDetector;
let runningMode: RunningMode = "IMAGE";
let video = document.getElementById("video-player") as HTMLVideoElement;
let videoParent = document.getElementById("video-container") as HTMLDivElement;
let lastVideoTime = -1;


export const FloatingVideo = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
    const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);

    const initObjDetector = async () => {
        try {
            console.log('trying to init');
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
        initObjDetector();
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

        if (isModelLoaded) {
            console.log('object detector is here:', objectDetector);
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

    const detectObject = async () => {
       let startTimeMs = performance.now();
       if(videoRef.current?.currentTime !== lastVideoTime && videoRef.current?.currentTime) {
           lastVideoTime = videoRef.current?.currentTime;
           const detections = objectDetector.detectForVideo(video, startTimeMs);
           // call function and send detections to it
       }
       window.requestAnimationFrame(detectObject);
    }

    var children:any[] = [];

    const displayHighlightedDetections = (detections: ObjectDetectorResult) => {
        for (let child of children) {
            videoParent.removeChild(child);
        }
        children.splice(0);


    }

    return (
        <div id="video-container" className="video-container flex flex-col justify-center text-center">
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
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        id="video-player"
                        className="video-player w-full max-w-[600px] rounded-[10px] border m-auto"
                    />) : null

            )}
        </div>
    )
        ;
}
