if (globalThis.__touchlessControl) {
    // Already injected into this tab.
} else {
    globalThis.__touchlessControl = true;

    let cursorEl = null;
    let previousGesture = "IDLE";
    let lastClickAt = 0;

    function ensureCursor() {
        if (cursorEl?.isConnected) return cursorEl;

        const host = document.createElement("div");
        host.id = "touchless-cursor-host";
        host.style.cssText = "all:initial;position:fixed;inset:0;z-index:2147483647;pointer-events:none;";

        const shadow = host.attachShadow({ mode: "open" });
        const cursor = document.createElement("div");
        cursor.style.cssText = [
            "position:fixed",
            "top:0",
            "left:0",
            "width:18px",
            "height:18px",
            "border-radius:50%",
            "background:#ff4d4d",
            "box-shadow:0 0 0 2px #fff, 0 0 12px rgba(0,0,0,.45)",
            "transform:translate(-100px,-100px)",
        ].join(";");
        shadow.appendChild(cursor);
        (document.documentElement || document.body).appendChild(host);
        cursorEl = cursor;
        return cursorEl;
    }

    function removeCursor() {
        document.getElementById("touchless-cursor-host")?.remove();
        cursorEl = null;
        previousGesture = "IDLE";
    }

    function clickAt(x, y) {
        const target = document.elementFromPoint(x, y);
        if (!target || typeof target.click !== "function") return;
        target.click();
        if (target instanceof HTMLElement) target.focus();
    }

    function onGesture(message) {
        if (typeof message.nx !== "number" || typeof message.ny !== "number") return;

        const cursor = ensureCursor();
        const x = message.nx * window.innerWidth;
        const y = message.ny * window.innerHeight;
        cursor.style.transform = `translate(${x - 9}px, ${y - 9}px)`;
        cursor.style.background = message.gesture === "CLICK" ? "#3b82f6" : "#ff4d4d";

        const gesture = message.gesture || "IDLE";
        const now = Date.now();
        if (gesture === "CLICK" && previousGesture !== "CLICK" && now - lastClickAt > 500) {
            lastClickAt = now;
            clickAt(x, y);
        }
        previousGesture = gesture;
    }

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message?.type === "PING") {
            sendResponse({ ok: true });
            return true;
        }
        if (message?.type === "GESTURE") onGesture(message);
        return false;
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === "local" && changes.cameraEnabled && !changes.cameraEnabled.newValue) {
            removeCursor();
        }
    });
}
