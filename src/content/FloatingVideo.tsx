import {useEffect, useRef, useState} from "react";
import type {HandLandmarker} from "@mediapipe/tasks-vision";
import {drawHandSkeleton, getHandLandmarks, initHandDetector} from "./gestureDetect.ts";
import {recognizeGesture} from "./gestures/gestureRecognizer.ts";
import {handleEvents} from "./gestures/gestureHandler.ts";

let handDetector: HandLandmarker | null = null;
let lastVideoTime = -1;

export const FloatingVideo = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const runningRef = useRef(false);
    const loopingRef = useRef(false);
    const aliveRef = useRef(true);

    const [error, setError] = useState<string | null>(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isHandModelLoaded, setIsHandModelLoaded] = useState(false);
    const [cursorReady, setCursorReady] = useState<boolean | null>(null);

    const stopCamera = () => {
        runningRef.current = false;
        loopingRef.current = false;
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
        setIsCameraOn(false);
    };

    const startCamera = async () => {
        setError(null);
        if (streamRef.current) {
            setIsCameraOn(true);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
            });
            if (!aliveRef.current) {
                stream.getTracks().forEach((track) => track.stop());
                return;
            }
            streamRef.current = stream;
            setIsCameraOn(true);
        } catch (e) {
            console.error(e);
            setError("Дозволь доступ до камери в цьому вікні");
        }
    };

    const startLoop = () => {
        if (loopingRef.current) return;
        loopingRef.current = true;
        runningRef.current = true;

        const loop = () => {
            if (!runningRef.current) {
                loopingRef.current = false;
                return;
            }

            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = ctxRef.current;

            try {
                if (video && canvas && ctx && handDetector && video.readyState >= 2 && video.currentTime !== lastVideoTime) {
                    lastVideoTime = video.currentTime;
                    const startTimeMs = performance.now();
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    const handDetections = getHandLandmarks(handDetector, video, startTimeMs);

                    if (handDetections?.landmarks?.length) {
                        drawHandSkeleton(handDetections, ctx);
                        handleEvents(recognizeGesture(handDetections), handDetections);
                    }
                }
            } catch (e) {
                console.error(e);
            }

            window.requestAnimationFrame(loop);
        };

        window.requestAnimationFrame(loop);
    };

    useEffect(() => {
        aliveRef.current = true;
        let cancelled = false;

        initHandDetector(setIsHandModelLoaded).then((detector) => {
            if (cancelled) return;
            if (detector) {
                handDetector = detector;
            } else {
                setError("Не вдалося завантажити модель руки");
            }
        });

        navigator.permissions?.query({name: "camera" as PermissionName}).then((status) => {
            if (!cancelled && status.state === "granted") startCamera();
        }).catch(() => undefined);

        return () => {
            cancelled = true;
            aliveRef.current = false;
            runningRef.current = false;
            loopingRef.current = false;
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        };
        // Camera is started from this mount and from the button click.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (typeof chrome === "undefined" || !chrome.storage?.session) return;

        chrome.storage.session.get("cursorReady", (stored) => {
            if (typeof stored.cursorReady === "boolean") setCursorReady(stored.cursorReady);
        });

        const onChange = (changes: {[key: string]: chrome.storage.StorageChange}, area: string) => {
            if (area === "session" && changes.cursorReady) {
                setCursorReady(changes.cursorReady.newValue === true);
            }
        };
        chrome.storage.onChanged.addListener(onChange);
        return () => chrome.storage.onChanged.removeListener(onChange);
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (!isCameraOn || !video || !streamRef.current) return;
        if (video.srcObject !== streamRef.current) {
            video.srcObject = streamRef.current;
        }
    }, [isCameraOn]);

    return (
        <div className="relative flex w-full flex-col items-center text-center">
            <h2 className="m-0 text-lg">Камера</h2>
            <p className="my-2 text-sm leading-snug">
                Вказівний палець рухає курсор на сайті. Щипок великим і вказівним другої руки — клік.
                {!isHandModelLoaded ? " Модель руки ще вантажиться." : ""}
            </p>
            <button onClick={() => (isCameraOn ? stopCamera() : startCamera())}>
                {isCameraOn ? "Вимкнути камеру" : "Дозволити камеру"}
            </button>
            {error ? <p className="text-red-500">{error}</p> : null}
            {cursorReady === false ? (
                <p className="my-2 text-sm leading-snug text-amber-400">
                    Зараз відкрита нова вкладка Chrome, курсор туди не ставиться. Натисни YouTube або введи адресу — червона точка з’явиться на сайті.
                </p>
            ) : null}
            {isCameraOn ? (
                <div className="relative mx-auto mt-3 w-full overflow-hidden rounded-[10px] border border-black">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        id="video-player"
                        className="block h-auto w-full -scale-x-100"
                        onLoadedData={() => {
                            const video = videoRef.current;
                            const canvas = canvasRef.current;
                            if (video && canvas) {
                                canvas.width = video.videoWidth;
                                canvas.height = video.videoHeight;
                                ctxRef.current = canvas.getContext("2d");
                            }
                            startLoop();
                        }}
                    />
                    <canvas
                        id="over-video"
                        ref={canvasRef}
                        className="pointer-events-none absolute top-0 left-0 h-full w-full -scale-x-100"
                    />
                </div>
            ) : null}
        </div>
    );
};
