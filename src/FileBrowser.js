import React, { Component } from 'react';

// File table component
class FileBrowser extends Component {
  renderTitle() {
    if (this.props.files) {
      return (
        <div className="browser-title">Re-load file</div>
      );
    }
  }

  renderFileList() {
    let fileList = [];

    if (this.props.files) {
      this.props.files.forEach(file => {
        fileList.push(
          <div className="browser-element" onClick={() => this.props.onFileClick(file)} >
            {file.name}
          </div>
        );
      });
    }

    return fileList;
  }

  renderPlayButton() {
    if (this.props.files)
      return (
        <div
          className="play-button"
          onClick={() => this.props.onPlayClick()}
        >
          Play Audio
        </div>
      );
  }

  render() {
    return (
      <div className="browser-container">
        {this.renderTitle()}
        {this.renderFileList()}
        {this.renderPlayButton()}
      </div>
    );
  }
}

export default FileBrowser;
