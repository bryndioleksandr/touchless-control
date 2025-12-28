import React, {useRef, useState, useEffect} from "react";

export const FloatingVideo = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [isCameraOn, setIsCameraOn] = useState<boolean>(false);

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

        if (isCameraOn) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [isCameraOn]);

    return (
        <div className="video-container flex flex-col justify-center text-center">
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
                    className="video-player w-full max-w-[600px] rounded-[10px] border m-auto"
                />) : null

            )}
        </div>
    )
        ;
}
