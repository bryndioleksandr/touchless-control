import {useEffect} from "react";
import {FloatingVideo} from "./content/FloatingVideo.tsx";

function App() {
    useEffect(() => {
        if (typeof chrome === "undefined" || !chrome.windows?.getCurrent || !chrome.storage?.session) return;

        chrome.windows.getCurrent((win) => {
            if (win.id != null) {
                chrome.storage.session.set({cameraWindowId: win.id});
            }
        });

        const onHide = (event: PageTransitionEvent) => {
            if (event.persisted) return;
            chrome.storage.local.set({cameraEnabled: false});
        };
        window.addEventListener("pagehide", onHide);
        return () => window.removeEventListener("pagehide", onHide);
    }, []);

    return (
        <div className="w-full px-3 py-3">
            <FloatingVideo/>
        </div>
    );
}

export default App;
