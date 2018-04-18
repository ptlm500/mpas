import React, { Component } from 'react';

// Renders a pre-recorded audio files waveform
class Waveform extends Component {
  // Draws a rectangle at position [x,y] of width w and height h with a colour c
  getRect(key, x, y, w, h, c) {
    return (
      <rect key={key} x={x} y={y} width={w} height={h} fill={c}/>
    );
  }

  // Draws the waveform graph
  getWaveform() {
    let waveform = [];
    // Define a step size based on input data size and defined width
    const step = Math.ceil(this.props.pcmdata.length / this.props.width);
    // Define maximum amplitude
    const amp = this.props.height / 2;

    // Iterate over the width of the display
    for (let i = 0; i < this.props.width; i++) {
      // Initialize min and max values for calculating amplitude
      let min = 1.0;
      let max = -1.0;
      // Iterate through the current step
      for (let j = 0; j < step; j++) {
        const key = (i*step)+j;
        // Extract the datam for this key
        const datum = this.props.pcmdata[key];
        // Update min and max values
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      // Add the waveform line at index i
      waveform.push(this.getRect(i, i, (1+min)*amp, 1, Math.max(1, (max-min)*amp), this.props.colour));
    }
    return waveform;
  }

  render() {
    return (
      <g>
        {this.getWaveform()}
      </g>
    );
  }
}

export default Waveform;
