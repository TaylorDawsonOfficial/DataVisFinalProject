class Data {
  constructor(stateName) {
    this.stateName = stateName;

    this.countyPopulation;
    this.stateHistoryPopulation;
    this.topologyData;

    this.stateVis;

    // will fire when everything has loaded. This is the main point of entry
    $.when(this.loadCounties(), this.loadStatePop(), this.loadMap()).done(() => {
      console.log('done loading everything');

      console.log("countyPopulation contains every county and the population between 2010-2019");
      //use the property fips to match up with the correct county on the map. on the map data it is under GEOID
      console.log(this.countyPopulation);

      console.log("stateHistroyPopulation contains the population of the state form 1969-2019");
      console.log(this.stateHistoryPopulation);

      console.log("topologyData contains the info to draw the map");

      this.stateVis = new State(this.stateName, this.topologyData, this.stateHistoryPopulation);
    });
  }

  loadCounties() {
    return $.ajax({
      method: "get",
      url: `/data/counties/${this.stateName}`,
      success: data => {
        this.countyPopulation = data;
      }
    });
  }

  loadStatePop() {
    return $.ajax({
      method: "get",
      url: `/data/population/${this.stateName}`,
      success: data => {
        this.stateHistoryPopulation = data;
      }
    });
  }

  loadMap() {
    return $.ajax({
      method: "get",
      url: `/data/topology/${this.stateName}`,
      success: data => {
        this.topologyData = data;
      }
    });
  }
}

$(document).ready(function () {
  Vis = new Data(STATE);

  // set navbar link to active
  $('#dropdown-state').addClass('active');
  $(`#dropdown-${STATE.toLowerCase().replace(' ', '-')}`).addClass('active');
})