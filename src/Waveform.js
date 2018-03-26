import React, { Component } from 'react';

class Waveform extends Component {

  getRect(key, x, y, w, h, c) {
    return (
      <rect key={key} x={x} y={y} width={w} height={h} fill={c}/>
    );
  }

  getWaveform() {
    let waveform = [];
    const step = Math.ceil( this.props.pcmdata.length / this.props.width);
    const amp = this.props.height / 2;

    for (let i = 0; i < this.props.width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const key = (i*step)+j;
        const datum = this.props.pcmdata[key];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
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
