import React, { Component } from 'react';
import Files from 'react-files';
import logo from './logo.svg';
import './App.css';
import { decode } from 'punycode';

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

function decodeSoundFile(soundFile) {
  let reader = new FileReader();

  reader.onload = (e) => {
    console.info('[File Loaded]');
    context.decodeAudioData(reader.result, (audioBuffer) => {
      console.log(audioBuffer);
      let pcmdata = (audioBuffer.getChannelData(0));
      let sampleRate = audioBuffer.sampleRate;
      findPeaks(pcmdata, sampleRate);
    });
  }

  reader.onprogress = (e) => {
    console.info('[Loading File] ' + (e.loaded / e.total * 100) + '%');
  }

  reader.readAsArrayBuffer(soundFile);
}

function finishedLoading(bufferList) {
  let source = context.createBufferSource();

  source.buffer = bufferList[0];

  source.connect(context.destination);
  source.start(0);
}

function findPeaks(pcmdata, samplerate){
  var interval = 0.05 * 1000;
  let index = 0;
  var step = Math.round( samplerate * (interval/1000) );
  var max = 0;
  var prevmax = 0;
  var prevdiffthreshold = 0.3;

  //loop through song in time with sample rate
  var samplesound = setInterval(function() {
    if (index >= pcmdata.length) {
      clearInterval(samplesound);
      console.log("finished sampling sound")
      return;
    }

    for(var i = index; i < index + step ; i++){
      max = pcmdata[i] > max ? pcmdata[i].toFixed(1)  : max ;
    }

    // Spot a significant increase? Potential peak
    let bars = getbars(max) ;
    if(max-prevmax >= prevdiffthreshold){
      bars = bars + " == peak == "
    }

    // Print out mini equalizer on commandline
    console.log(bars, max )
    prevmax = max ; max = 0 ; index += step ;
  }, interval,pcmdata);
}

function getbars(val){
  let bars = ""
  for (var i = 0 ; i < val*50 + 2 ; i++){
    bars= bars + "|";
  }
  return bars;
}

class App extends Component {
  onFilesChange(files) {
    console.log(files);
    decodeSoundFile(files[0]);
  }

  onFilesError(error, file) {
    console.error('[File Load] ' + error.code + ': ' + error.message);
  }

  render() {
    initAudio();
    return (
      <div className="App">
        <Files
          className="files-dropzone"
          onChange={this.onFilesChange}
          onError={this.onFilesError}
          accepts={['audio/*']}
          multiple
          maxFiles={1}
          minFileSize={0}
          clickable
        >
          Drop An Audio File here!
        </Files>
      </div>
    );
  }
}

export default App;
