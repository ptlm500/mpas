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

function initAudio() {
  try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
  } catch (e) {
    alert('Something went wrong');
  }
}

// function decodeSoundFile(soundFile) {
//   let reader = new FileReader();
//   let pcmdata;
//   reader.onload = (e) => {
//     console.info('[File Loaded]');
//     context.decodeAudioData(reader.result, (audioBuffer) => {
//       console.log(audioBuffer);
//       pcmdata = (audioBuffer.getChannelData(0));
//       let samplerate = audioBuffer.sampleRate;
//       findPeaks(pcmdata, samplerate);
//       playSound(audioBuffer);
//       return pcmdata;
//     });
//   }

//   reader.onprogress = (e) => {
//     console.info('[Loading File] ' + (e.loaded / e.total * 100) + '%');
//   }

//   reader.readAsArrayBuffer(soundFile);
// }

function findPeaks(pcmdata, samplerate){
  console.log(pcmdata);
  let interval = 0.05 * 1000;
  let index = 0;
  let step = Math.round( samplerate / 1000 * (interval/1000) );
  // let step = 1;
  let max = 0;
  let prevmax = 0;
  let prevdiffthreshold = 0.3;
  let peaks = [];

  let thresholds = getThresholdData(pcmdata, samplerate, step);

  //loop through song in time with sample rate
  let samplesound = setInterval(() => {
    if (index >= pcmdata.length) {
      clearInterval(samplesound);
      console.log("finished sampling sound")
      return;
    }

    let thresholdIndex = 0;

    for(let i = index; i < index + step ; i++){
      max = pcmdata[i] > max ? pcmdata[i].toFixed(1) : max;
      // max = median([pcmdata[i-2], pcmdata[i-1], pcmdata[i], pcmdata[i+1], pcmdata[i+2]]);
      // max = Math.pow(max, 2);
    }

    // Spot a significant increase? Potential peak
    let bars = getbars(max) ;
    if (max-prevmax >= thresholds[thresholdIndex] && max-prevmax > 0){
      bars = bars + " == peak == ";
      peaks.push(index);
    }

    // Print out mini equalizer on commandline
    console.log(bars, max, index);
    // console.log(max, prevmax, thresholds[thresholdIndex]);
    prevmax = max;
    max = 0;
    index += step;
    thresholdIndex++;
  }, interval, pcmdata);

  console.log(peaks.length);
  return peaks;
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
          Drop An Audio File here!
        </Files>
        <svg className="waveform-container">
          {this.drawWaveform()}
          {this.drawPeaks()}
        </svg>
      </div>
    );
  }
}

export default App;
