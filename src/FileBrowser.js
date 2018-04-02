import React, { Component } from 'react';

class FileBrowser extends Component {
  renderFileList() {
    let fileList = [];

    if (this.props.files) {
      this.props.files.forEach(file => {
        fileList.push(
          <div onClick={() => this.props.onFileClick(file)} >
            {file.name}
          </div>
        );
      });
    }

    return fileList;
  }

  render() {
    console.log(this.props.files);
    return (
      <div>
        {this.renderFileList()}
      </div>
    );
  }
}

export default FileBrowser;
