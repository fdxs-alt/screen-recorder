const { desktopCapturer, remote } = require("electron");

const { writeFile } = require("fs");

const { Menu, dialog } = remote;

let mediaRecorder;
let playing = false;
const recorded = [];

const videoEl = document.querySelector("video");

const getVideoSources = async () => {
  const inputSources = await desktopCapturer.getSources({
    types: ["window", "screen"],
  });

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map((source) => {
      return {
        label: source.name,
        click: () => selectSource(source),
      };
    })
  );
  videoOptionsMenu.popup();
};

const selectSource = async (source) => {
  selectBtn.innerText = source.name;

  const constraintsVideo = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id,
      },
    },
  };

  const videoStream = await navigator.mediaDevices.getUserMedia(
    constraintsVideo
  );

  videoEl.srcObject = videoStream;
  videoEl.play();

  const options = { mimeType: "video/webm; codecs = vp9" };
  mediaRecorder = new MediaRecorder(videoStream, options);

  mediaRecorder.ondataavaliable = handleDataAvaliable;
  mediaRecorder.onstop = handleStop;
};

const handleDataAvaliable = (e) => {
  recorded.push(e.data);
};

const handleStop = async (e) => {
  const blob = new Blob(recorded, { type: "video/webm; codecs = vp9" });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save video",
    defaultPath: `vid-${Date.now()}.webm`,
  });

  if (filePath) {
    writeFile(filePath, buffer, () => console.log("Saved"));
  }
};

const startBtn = document.querySelector(".button-start");
startBtn.onclick = (e) => {
  if (playing) return;
  playing = true;
  mediaRecorder.start();
  startBtn.innerText = "Recording";
};

const stopBtn = document.querySelector(".button-stop");

stopBtn.onclick = (e) => {
  if (!playing) return;
  playing = false;
  mediaRecorder.stop();
  startBtn.innerText = "Start";
};

const selectBtn = document.querySelector(".select-button");
selectBtn.onclick = getVideoSources;
