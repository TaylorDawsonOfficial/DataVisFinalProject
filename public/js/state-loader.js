class Data {
  constructor(stateName) {
    this.stateName = stateName;

    this.countyPopulation = {};
    this.stateHistoryPopulation = {};
    this.topologyData;
    this.startYear = 2010; //The year th at the slider starts at

    this.stateVis;

    this.selectedData = "total-pop";

    // will fire when everything has loaded. This is the main point of entry
    $.when(this.loadCounties(), this.loadStatePop(), this.loadMap()).done(
      () => {
        console.log("done loading everything");

        console.log(
          "countyPopulation contains every county and the population between 2010-2019"
        );
        //use the property fips to match up with the correct county on the map. on the map data it is under GEOID
        console.log(this.countyPopulation);

        console.log(
          "stateHistroyPopulation contains the population of the state form 1969-2019"
        );
        console.log(this.stateHistoryPopulation);

        console.log("topologyData contains the info to draw the map");

        console.log(this.stateHistoryPopulation);

        this.stateVis = new State(
          this.stateName,
          this.topologyData,
          this.stateHistoryPopulation,
          this.startYear,
          this.countyPopulation
        );
      }
    );
  }

  /**
   * Load county-level population for each year of data
   * @returns
   */
  loadCounties() {
    return $.ajax({
      method: "get",
      url: `/data/counties/${this.stateName}`,
      success: (data) => {
        Object.entries(data).forEach((d) => {
          const county_id = d[1].fips;
          const county_name = d[1].county;

          let minPop = Number.MAX_SAFE_INTEGER;
          let maxPop = Number.MIN_SAFE_INTEGER;

          //Add county population data for each year
          d[1].years.forEach((d) => {
            if (this.countyPopulation[d.year] === undefined) {
              this.countyPopulation[d.year] = {};
              this.countyPopulation[d.year]["lowest_population"] =
                Number.MAX_SAFE_INTEGER;
              this.countyPopulation[d.year]["highest_population"] =
                Number.MIN_SAFE_INTEGER;
            }

            this.countyPopulation[d.year][county_id] = {
              name: county_name,
              population: d.population,
            };

            if (
              d.population < this.countyPopulation[d.year]["lowest_population"]
            )
              this.countyPopulation[d.year]["lowest_population"] = d.population;

            if (
              d.population > this.countyPopulation[d.year]["highest_population"]
            )
              this.countyPopulation[d.year]["highest_population"] =
                d.population;
          });
        });
      },
    });
  }

  /**
   * Load state-level population for each year of data
   * @returns
   */
  loadStatePop() {
    return $.ajax({
      method: "get",
      url: `/data/population/${this.stateName}`,
      success: (data) => {
        Object.entries(data.years).forEach((d) => {
          this.stateHistoryPopulation[d[1].year] = d[1].population;
        });
      },
    });
  }

  loadMap() {
    return $.ajax({
      method: "get",
      url: `/data/topology/${this.stateName}`,
      success: (data) => {
        this.topologyData = data;
      },
    });
  }

  assignPopData() {
    this.stateVis.assignPopData(
      this.countyPopulation[slider.value],
      this.stateHistoryPopulation[slider.value]
    );
  }

  updateLegend() {
    this.stateVis.updateLegend(
      this.countyPopulation[slider.value],
      this.stateHistoryPopulation[slider.value]
    );
  }
}

/*
  Slider code
*/
const slider = document.querySelector("#slider");
const output = document.querySelector(".yearOutput");

/*
  Updates the text for the slider whenever the slider moves
*/
slider.oninput = function () {
  output.innerHTML = this.value;
  Vis.updateLegend();
  Vis.assignPopData();
};

function initializeSlider(minDate) {
  slider.min = minDate;
  slider.max = 2019;
  slider.value = slider.min;
  output.innerHTML = slider.value;
}

$(document).ready(function () {
  initializeSlider(2010);
  Vis = new Data(STATE);

  // set navbar link to active
  $("#dropdown-state").addClass("active");
  $(`#dropdown-${STATE.toLowerCase().replace(" ", "-")}`).addClass("active");

  // watch the button change
  $("#radio-buttons").change(() => {
    Vis.selectedData = $("input[name='radio_buttons']:checked").val();
    if (Vis.selectedData === "pop-increase") {
      initializeSlider(2011);
    } else {
      initializeSlider(2010);
    }
    Vis.assignPopData();
  });
});
