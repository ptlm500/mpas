import React, { Component } from 'react';

class PeakLines extends Component {
  getPeaks() {
    let peaks = [];
    // Define a step size based on input data size and defined width
    const step = Math.ceil( this.props.dataLength / this.props.width);

     // Iterate over the width of the display
    for (let i= 0; i < this.props.width; i++) {
      let peak;

      // Iterate through the current step
      for (let j = 0; j < step; j++) {
        // Check if a peak exists in this step
        if (this.props.peaks[(i * step) + j])
          peak = this.props.peaks[(i * step) + j];
      }

      // If a peak exists, add a peak line
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
