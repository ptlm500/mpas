import React, { Component } from 'react';
import Files from 'react-files';
import './App.css';
import Waveform from './Waveform';
import PeakLines from './PeakLines';
import LivePeakDisplay from './LivePeakDisplay';
import FileBrowser from './FileBrowser';

let context;
let input;
let analyser;
let scriptProcessor;

let prevLiveMax;
let liveBuffer;
let liveMax;
let nextLiveMax = 0;

let liveThresholdBuffer;

// Initialize audio system
function initAudio() {
  // Attempt to connect to browser audio context
  try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
  } catch (e) {
    alert('[initAudio] Error initialising audio: ', e);
  }
}

// Get threshold data from a pcm array
function getThresholdData(pcmdata, samplerate, step) {
  let thresholds = [];
  let i = 0;

  // Iterate over the pcm data array and calculate the median value between
  // the current index and the index + the step size
  while (i < pcmdata.length) {
    thresholds[i] = (median(pcmdata.slice(i, i += step)));
  }

  console.log('thresholds', thresholds);
  return thresholds;
}

// Calculates the mean value of an array
function mean(array) {
  let total = 0;
  for (let i = 0; i < array.length; i++) {
    total += Math.pow(array[i], 2);
  }

  return Math.abs(total/array.length);
}

// Calculates the median value in an array
function median(array) {
  array.sort((a,b) => a - b);
  const half = Math.floor(array.length / 2);

  const result = array.length % 2 ? array[half] : (array[half - 1] + array[half]) / 2;

  return Math.abs(result);
}

// Plays an audio buffer
function playSound(buffer) {
  // Create the source
  var source = context.createBufferSource();
  // Load the buffer
  source.buffer = buffer;
  // Connect the source to the browser output
  source.connect(context.destination);
  source.start(0);
}

const livePeakHistorySize = 1000;   // The maximum size for the peak history array

// Updates the peak history array
function updateLivePeaks(peakArray, peak) {
  const maxArraySize = livePeakHistorySize;
  let newPeakArray = peakArray;

  // Initialize the array if necessary
  if (!newPeakArray)
    newPeakArray = [];

  newPeakArray.reverse();
  // Shift the array by 1 if at maxmimum size
  if (newPeakArray.length + 1 === maxArraySize) {
    newPeakArray.shift();
  }
    // Append the new value to the array
  newPeakArray.push(peak);

  return newPeakArray.reverse();
}

const svgWidth = 1000;
const svgHeight = 500;
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.audioInitialized = false;
  }

  // Initialize stream from audio input
  initStream() {
    // Get audio device
    navigator.mediaDevices.getUserMedia({
      audio: true,
    }).then(stream => {
      // Connect stream to input
      input = context.createMediaStreamSource(stream);
      // Create processors for analysis
      analyser = context.createAnalyser();
      scriptProcessor = context.createScriptProcessor();
      // Set up analyser
      analyser.smoothingTimeConstant = 0.3;
      analyser.fftSize = 4096;

      // Connect processors
      input.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(context.destination);

      // Call processInput for new stream data
      scriptProcessor.onaudioprocess = this.processInput;
    }, e => {
      console.error('[initStream] Error initialising audio stream: ', e);
    })
  }

  // Checks for an onset in the incoming stream
  processInput = audioProcessingEvent => {
    // Initialize the current buffer
    const buffer = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(buffer);

    // Find the maximum value in the buffer
    for (let i = 0; i < buffer.length; i++) {
      const datum = Math.pow(buffer[i], 2);
      nextLiveMax = datum > nextLiveMax ? datum.toFixed(1) : nextLiveMax;
    }

    // Update the threshold buffer
    this.updateThresholdBuffer(buffer);

    if (liveMax && prevLiveMax) {
      // Calculate the threshold value for peak picking
      let threshold = mean(liveThresholdBuffer);

      // Perform peak picking
      if (liveMax-prevLiveMax >= threshold && mean(liveBuffer) > threshold && liveMax > nextLiveMax) {
        this.setState({
          peakArray: updateLivePeaks(this.state.peakArray, true)
        });
      } else {
        this.setState({
          peakArray: updateLivePeaks(this.state.peakArray, false)
        });
      }
    } else {
      this.setState({
        peakArray: updateLivePeaks(this.state.peakArray, false)
      });
    }

    // Update values for next cycle
    prevLiveMax = liveMax;
    liveBuffer = buffer;
    liveMax = nextLiveMax;
    nextLiveMax = 0;
  }

  // Updates the threshold buffer for the live input
  updateThresholdBuffer(buffer) {
    if (!liveThresholdBuffer) {
      // Initialize the buffer if necessary
      liveThresholdBuffer = Array.from(buffer);
    } else if (liveThresholdBuffer.length === buffer.length * 10 - 1) {
      // Remove the oldest buffer to make space for the newest buffer
      liveThresholdBuffer.splice(buffer.length - 1, 0);
    }

    // Add the new buffer
    liveThresholdBuffer = liveThresholdBuffer.concat(Array.from(buffer));
  }

  // Detects onsets in a pcm data buffer
  findPeaks(pcmdata, samplerate) {
    // Define the step size
    const step = Math.round( samplerate * 0.05);

    let max = 0;
    let prevMax = 0;
    let nextMax = 0;
    let peaks = [];

    // Get the threshold data from the pcm data buffer
    let thresholds = getThresholdData(pcmdata, samplerate, step);

    // Step through the pcm data buffer
    for (let i = 0; i < pcmdata.length; i += step) {
      // Find the maximum value in the step
      for (let j = i; j < i + step; j++) {
        const datum = Math.pow(pcmdata[j], 2);
        max = datum > max ? datum.toFixed(1) : max;
      }
      // Find the maximum value in the next step
      for (let j = i + step; j < i + step * 2; j++) {
        const datum = Math.pow(pcmdata[j], 2);
        nextMax = datum > nextMax ? datum.toFixed(1) : nextMax;
      }

      // Perform peak picking
      if (max-prevMax >= thresholds[i] && max >= nextMax && max-prevMax > 0) {
        peaks[i] = true;
      }

      // Update values for next step
      prevMax = max;
      max = 0;
    }

    return peaks;
  }

  // Converts a sound file to a pcm data buffer
  decodeSoundFile(soundFile) {
    console.log('[Start decoding sound file]');
    // Initialize the file reader
    let reader = new FileReader();
    // Define behaviour on reader load
    reader.onload = (e) => {
      console.info('[File Loaded]');
      // Decode the audio buffer on load
      context.decodeAudioData(reader.result, (audioBuffer) => {
        // Extract the pcm data and sample rate
        let pcmdata = (audioBuffer.getChannelData(0));
        let samplerate = audioBuffer.sampleRate;
        // Perform onset detection
        let peaks = this.findPeaks(pcmdata, samplerate);

        playSound(audioBuffer);
        // Store the pcm data and peaks
        this.setState({
          pcmdata: pcmdata,
          peaks: peaks
        });
      });
    }

    // Define reader behaviour on progress
    reader.onprogress = (e) => {
      console.info('[Loading File] ' + (e.loaded / e.total * 100) + '%');
    }

    // Read the sound file
    reader.readAsArrayBuffer(soundFile);
  }

  // When a new file is loaded, add to storage and analyse it
  onFilesChange(files) {
    this.setState({files: files});
    this.decodeSoundFile(files[files.length - 1]);
  }

  onFilesError(error, file) {
    console.error('[File Load] ' + error.code + ': ' + error.message);
  }

  // Initialize streaming when live input is started
  onLiveButtonClick() {
    this.initStream();
  }

  // Load a file if the file input is clicked
  onFileClick(file) {
    if (file) {
      this.decodeSoundFile(file);
    } else {
      console.error('[onFileClick]: No file supplied');
    }
  }

  // Draws a waveform from the stored pcm data buffer
  drawWaveform() {
    if (this.state.pcmdata) {
      return (
        <Waveform pcmdata={this.state.pcmdata} width={svgWidth} height={svgHeight} colour={"black"}/>
      );
    }
  }

  // Draws the peaks from the analysis of the stored pcm data buffer
  drawPeaks() {
    if (this.state.pcmdata && this.state.peaks) {
      return (
        <PeakLines
          dataLength={this.state.pcmdata.length}
          peaks={this.state.peaks}
          width={svgWidth}
          height={svgHeight}
          colour={"red"}
        />
      );
    }
  }

  // Draws incoming peaks from the live input
  drawLivePeaks() {
    if (this.state.peakArray) {
      return (
        <LivePeakDisplay
          dataLength={livePeakHistorySize}
          peaks={this.state.peakArray}
          width={svgWidth}
          height={svgHeight}
          colour={"red"}
        />
      );
    }
  }

  // Main rendering function, draws all UI elements
  render() {
    // Initialize audio on first run
    if (!this.audioInitialized) {
      initAudio();
      this.audioInitialized = true;
    }

    return (
      <div className="App">
        <Files
          className="files-dropzone"
          onChange={files => this.onFilesChange(files)}
          onError={(e, file) => this.onFilesError(e, file)}
          accepts={['audio/*']}
          multiple
          minFileSize={0}
          clickable
        >
          <span className="dropzone-label">
            Drop an audio file here for analysis
          </span>
        </Files>
        <div className="recorded-analyser-container">
          <svg className="waveform-container">
            {this.drawWaveform()}
            {this.drawPeaks()}
          </svg>
          <FileBrowser
            files={this.state.files}
            onFileClick={file => this.onFileClick(file)}
          />
        </div>
        <div className="live-button" onClick={e => this.onLiveButtonClick()}>
          Use live input
        </div>
        <div>
          <svg className="waveform-container">
            {this.drawLivePeaks()}
          </svg>
          <span>Live input history (peaks shown in red)</span>
        </div>
      </div>
    );
  }
}

export default App;
