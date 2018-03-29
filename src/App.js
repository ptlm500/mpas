import React, { Component } from 'react';
import Files from 'react-files';
import logo from './logo.svg';
import './App.css';
import { decode } from 'punycode';
import Waveform from './Waveform';
import PeakLines from './PeakLines';

let soundFile = '/120test.wav';

let context;
let bufferLoader;
let input;
let analyser;
let scriptProcessor;

function initAudio() {
  try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();

  } catch (e) {
    alert('[initAudio] Error initialising audio: ', e);
  }
}

function initStream() {
  navigator.mediaDevices.getUserMedia({
    audio: true,
  }).then(stream => {
    input = context.createMediaStreamSource(stream);
    analyser = context.createAnalyser();
    scriptProcessor = context.createScriptProcessor();

    analyser.smoothingTimeConstant = 0.3;
    analyser.fftSize = 2048;

    input.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(context.destination);

    scriptProcessor.onaudioprocess = processInput;
  }, e => {
    console.error('[initStream] Error initialising audio stream: ', e);
  })
}

let prevLiveMax;
let liveMax;
let nextLiveMax = 0;

const processInput = audioProcessingEvent => {
  const tempArray = new Uint8Array(analyser.frequencyBinCount);

  analyser.getByteFrequencyData(tempArray);

  for (let i = 0; i < tempArray.length; i++) {
    const datum = Math.pow(tempArray[i], 2);
    // console.log(datum);
    nextLiveMax = datum > nextLiveMax ? datum.toFixed(1) : nextLiveMax;
  }
  // console.log(nextLiveMax, liveMax, prevLiveMax);

  if (liveMax && prevLiveMax) {
    let threshold = median(tempArray);
    if (liveMax-prevLiveMax >= threshold && liveMax >= nextLiveMax && liveMax-prevLiveMax !== 0) {
      console.log('peak', liveMax, prevLiveMax, nextLiveMax);
    }
  }

  prevLiveMax = liveMax;
  liveMax = nextLiveMax;
  nextLiveMax = 0;
}

function getThresholdData(pcmdata, samplerate, step) {
  let thresholds = [];
  let i = 0;
  let n = pcmdata.length;

  while (i < n) {
    thresholds[i] = (median(pcmdata.slice(i, i += step)));
  }

  // for (let i = 0; i < pcmdata.length; i++) {
  //   thresholds[i] = (median(pcmdata.slice(i, i + step)));
  // }

  console.log('thresholds', thresholds);
  return thresholds;
}

function mean(array) {
  let total = 0;
  for (let i = 0; i < array.length; i++) {
    total += array[i];
  }

  return Math.abs(total/array.length);
}

function median(array) {
  array.sort((a,b) => a - b);
  const half = Math.floor(array.length / 2);

  const result = array.length % 2 ? array[half] : (array[half - 1] + array[half] / 2);

  return Math.abs(result);
}

function findPeaksAtThreshold(pcmData, threshold) {
  let peaksArray = [];
  let length = pcmData.length;
  for (let i = 0; i < length;) {
    if (pcmData[i] > threshold) {
      peaksArray.push(i);
    }
  }
}

function getbars(val){
  let bars = ""
  for (var i = 0 ; i < val*50 + 2 ; i++){
    bars= bars + "|";
  }
  return bars;
}

function playSound(buffer) {
  var source = context.createBufferSource(); // creates a sound source
  source.buffer = buffer;                    // tell the source which sound to play
  source.connect(context.destination);       // connect the source to the context's destination (the speakers)
  source.start(0);                           // play the source now
                                             // note: on older systems, may have to use deprecated noteOn(time);
}

const svgWidth = 1000;
const svgHeight = 500;
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  findPeaks(pcmdata, samplerate) {
    const interval = 0.05 * 1000;
    const step = Math.round( samplerate * (interval / 1000));

    let max = 0;
    let prevMax = 0;
    let nextMax = 0;
    let prevDiffThreshold = 0.3;
    let peaks = [];

    let thresholds = getThresholdData(pcmdata, samplerate, step);

    for (let i = 0; i < pcmdata.length; i += step) {
      // console.log(i);

      for (let j = i; j < i + step; j++) {
        const datum = Math.pow(pcmdata[j], 2);
        // const datum = pcmdata[j];
        max = datum > max ? datum.toFixed(1) : max;
        // console.log('**', max);
      }

      for (let j = i + step; j < i + step * 2; j++) {
        const datum = Math.pow(pcmdata[j], 2);
        // const datum = pcmdata[j];
        nextMax = datum > nextMax ? datum.toFixed(1) : nextMax;
      }

      console.log(max-prevMax >= thresholds[i], max, prevMax, nextMax, thresholds[i]);
      if (max-prevMax >= thresholds[i] && max >= nextMax && max-prevMax !== 0) {
        peaks[i] = true;
      }

      prevMax = max;
      max = 0;
    }

    return peaks;
  }

  decodeSoundFile(soundFile) {
    console.log('[Start decoding sound file]');
    let reader = new FileReader();
    reader.onload = (e) => {
      console.info('[File Loaded]');
      context.decodeAudioData(reader.result, (audioBuffer) => {
        console.log(audioBuffer);
        let pcmdata = (audioBuffer.getChannelData(0));
        let samplerate = audioBuffer.sampleRate;
        let peaks = this.findPeaks(pcmdata, samplerate);

        playSound(audioBuffer);
        this.setState({
          pcmdata: pcmdata,
          peaks: peaks
        });
      });
    }

    reader.onprogress = (e) => {
      console.info('[Loading File] ' + (e.loaded / e.total * 100) + '%');
    }

    reader.readAsArrayBuffer(soundFile);
  }

  onFilesChange(files) {
    console.log(files);
    this.decodeSoundFile(files[0]);
  }

  onFilesError(error, file) {
    console.error('[File Load] ' + error.code + ': ' + error.message);
  }

  onLiveButtonClick() {
    initStream();
  }

  drawWaveform() {
    if (this.state.pcmdata) {
      return (
        <Waveform pcmdata={this.state.pcmdata} width={svgWidth} height={svgHeight} colour={"black"}/>
      );
    }
  }

  drawPeaks() {
    if (this.state.pcmdata && this.state.peaks) {
      return (
        <PeakLines
          pcmdata={this.state.pcmdata}
          peaks={this.state.peaks}
          width={svgWidth}
          height={svgHeight}
          colour={"red"}
        />
      );
    }
  }

  render() {
    initAudio();
    return (
      <div className="App">
        <Files
          className="files-dropzone"
          onChange={files => this.onFilesChange(files)}
          onError={(e, file) => this.onFilesError(e, file)}
          accepts={['audio/*']}
          multiple
          maxFiles={1}
          minFileSize={0}
          clickable
        >
          <span className="dropzone-label">
            Drop an audio file here for analysis
          </span>
        </Files>
        <svg className="waveform-container">
          {this.drawWaveform()}
          {this.drawPeaks()}
        </svg>
        <div className="live-button" onClick={e => this.onLiveButtonClick()}>
          Use live input
        </div>
      </div>
    );
  }
}

export default App;
