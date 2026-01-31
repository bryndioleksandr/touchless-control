navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then((stream) => {
        console.log("Камера підключена!");

    })
    .catch((err) => {
        console.error("Помилка доступу до камери:", err);
    });
