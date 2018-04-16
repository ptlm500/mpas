import React, { Component } from 'react';

class LivePeakDisplay extends Component {
  // Draws the peak lines
  getPeaks() {
    let peaks = [];

    // Iterate over the width of the display
    for (let i= 0; i < this.props.width; i++) {
      // If a peak exists at point i, add a line to the display
      if (this.props.peaks[i])
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

export default LivePeakDisplay;
