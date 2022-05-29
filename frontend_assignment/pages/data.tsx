import React, { Component } from 'react';
import './App.css';

class data extends Component {
  state = {
    userInput: ''
  }

  inputChangedHandler = (event: any) => {
    this.setState({userInput : event});
  }

  render() {
    return (
      <div className="App">
        <input type="text" onChange={this.inputChangedHandler} 
        value={this.state.userInput}/>
        <p>{this.state.userInput}</p>
     </div>
    );
  }
}
export default data;