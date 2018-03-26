import React, { Component } from 'react';

class PeakLines extends Component {

  getPeaks() {
    let peaks = [];
    const step = Math.ceil( this.props.pcmdata.length / this.props.width);

    for (let i= 0; i < 1000; i++) {
      let peak;

      for (let j = 0; j < step; j++) {
        if (this.props.peaks[(i * step) + j])
          peak = this.props.peaks[(i * step) + j];
      }

      if (peak)
        peaks.push(
          <rect key={i} x={i} y={0} width={2} height={this.props.height} fill={this.props.colour}/>
        );
    }

    return peaks;
  }

  render() {
    return (
      <g>
        {this.getPeaks()}
      </g>
    )
  }
}

export default PeakLines;
