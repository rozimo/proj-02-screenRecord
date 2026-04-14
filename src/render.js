// Use ipcRenderer instead of remote 
const { ipcRenderer } = require("electron");

// Get buttons
const videoElement = document.querySelector("video"); // Gets video button
const startButton = document.getElementById("startButton"); // Get start button
const stopButton = document.getElementById("stopButton"); // Get stoop button
const videoSourceButton = document.getElementById("videoSourceButton"); // Get video source button

// Event handlers
// Click handler for source button
videoSourceButton.onclick = () => {
    // Tells Main process (index.js) to show the menu.
    ipcRenderer.send("show-video-sources");
};
// Listen for the selection coming back from Main process (index.js)
ipcRenderer.on("source-selected", async (event, sourceId) => {
    videoSourceButton.innerText = "Source Selected";
    await selectSource(sourceId);
});

let mediaRecorder; // mediaRecorder instance to capture footage.
const recordedChunks = []; // Empty array for recordedChunks

startButton.onclick = e => {
    if (!mediaRecorder) return alert ("Please select a video source first!");
    mediaRecorder.start();
    startButton.classList.add("is-danger");
    startButton.innerText = "Recording";
}

stopButton.onclick = e => {
    mediaRecorder.stop();
    startButton.classList.remove('is-danger');
    startButton.innerText = 'Start';
};

// The function that handles the actual stream
async function selectSource(sourceId) {
    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: sourceId
            }
        }
    };

    // Create a Stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Preview the source in the <video> element
    videoElement.srcObject = stream;
    videoElement.play();

    // Create the media recorder
    const options = {mimeType: "video/webm; codecs=vp9"};
    mediaRecorder = new MediaRecorder(stream, options);

    // Register Event Handlers
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;

    // Capture all recorded chunks
    function handleDataAvailable(e) {
        console.log("video data available");
        recordedChunks.push(e.data);
    }

    // Saves the video file on stop
    async function handleStop(e) {
    const blob = new Blob(recordedChunks, {
            type: 'video/webm; codecs=vp9'
        });

        const buffer = Buffer.from(await blob.arrayBuffer());

        // We send the buffer to the Main process to save it
        ipcRenderer.send('save-video', buffer);
        
        // Clear chunks for the next recording
        recordedChunks.length = 0;
    }
}