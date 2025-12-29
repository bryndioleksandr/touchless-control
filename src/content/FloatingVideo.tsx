import {useRef, useState, useEffect} from "react";
import {ObjectDetector, FilesetResolver, type ObjectDetectorResult} from "@mediapipe/tasks-vision";


let objectDetector: ObjectDetector;
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
        if (!canvasRef.current) return;

        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;

        ctxRef.current = ctx;
    }, [canvasRef, isCameraOn]);

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
       if(videoRef.current?.currentTime !== lastVideoTime && videoRef.current?.currentTime && objectDetector) {
           lastVideoTime = videoRef.current?.currentTime;
           const detections = objectDetector.detectForVideo(videoRef.current, startTimeMs);
           console.log('detections:', detections);
           // call function and send detections to it
           displayHighlightedDetections(detections);
       }
       window.requestAnimationFrame(detectObject);
    }

    var children:any[] = [];

    const displayHighlightedDetections = (detections: ObjectDetectorResult) => {
        for (let child of children) {
            videoContainerRef.current?.removeChild(child);
        }
        children.splice(0);
        if(canvasRef.current && ctxRef.current) {
            // console.log('drawing DRAWING', detections.detections[0].boundingBox?.originX as number, detections.detections[0].boundingBox?.originY as number, detections.detections[0].boundingBox?.width as number, detections.detections[0].boundingBox?.height as number)
            const ctx = ctxRef.current;
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctx.fillStyle = "rgba(88, 231, 0, 0.5)";
            ctx.fillRect(detections.detections[0].boundingBox?.originX as number, detections.detections[0].boundingBox?.originY as number, detections.detections[0].boundingBox?.width as number, detections.detections[0].boundingBox?.height as number)
            // if(!(detections.detections[0].boundingBox)) return;
            // const { originX, originY, width, height } = detections.detections[0].boundingBox;

            // ctx.beginPath();
            // ctx.lineWidth = 4;
            // ctx.strokeStyle = "#00FF00";
            // ctx.rect(originX, originY, width-10, height);
            // ctx.stroke();
            //
            // ctx.fillStyle = "rgba(0, 255, 0, 0.1)";
            // ctx.fill();

            // if (detections.detections[0].categories[0]) {
            //     const label = `${detections.detections[0].categories[0].categoryName} ${Math.round(detections.detections[0].categories[0].score * 100)}%`;
            //     ctx.fillStyle = "#00FF00";
            //     ctx.font = "20px Arial";
            //     ctx.fillText(label, originX, originY - 10);
            // }
        }

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
                        className="w-full h-auto block"
                        onLoadedData={() => {
                            if (canvasRef.current && videoRef.current) {
                                canvasRef.current.width = videoRef.current.videoWidth;
                                canvasRef.current.height = videoRef.current.videoHeight;
                            }
                            console.log('start detection');
                            detectObject();
                        }}
                    />
                        <canvas id="over-video" ref={canvasRef} className="absolute top-0 left-0 pointer-events-none flex items-center justify-center text-white font-bold bg-black/20"/>
                    </div>) : null

            )}
        </div>
    )
        ;
}
