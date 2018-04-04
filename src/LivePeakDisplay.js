import React, { Component } from 'react';

class LivePeakDisplay extends Component {
  getPeaks() {
    let peaks = [];
    const step = Math.ceil( this.props.dataLength / this.props.width);

    // console.log(step, this.props.peaks);

    for (let i= 0; i < this.props.width; i++) {
      let peak;

      for (let j = 0; j < step; j++) {
        if (this.props.peaks[(i * step) + j])
          peak = this.props.peaks[(i * step) + j];
      }

      if (peak)
        peaks.push(
          <rect key={i} x={i} y={0} width={2} height={this.props.height} fill={this.props.colour}/>
        );
      // else
      // peaks.push(
      //   <rect key={i} x={i} y={0} width={2} height={this.props.height} fill={"blue"}/>
      // );

      // console.log(i, peak);
    }

    return peaks;

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
