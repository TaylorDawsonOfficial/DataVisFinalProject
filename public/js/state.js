class State {
  constructor(stateObj) {
    this.stateObj = stateObj;
    this.state = stateObj.properties.name;

    $('#selectedState').text(this.state);
  }
}