class State {
  constructor(stateObj) {
    this.stateObj = stateObj;
    this.state = stateObj.properties.name;

    $("#selectedState").text(this.state);
    $.ajax({
      method: "get",
      url: "/data/historical-population",
      success: (data) => {
        console.log(data);
      },
    });
  }
}
