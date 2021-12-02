class Data {
  constructor(stateName) {
    this.stateName = stateName;

    this.countyPopulation = {};
    this.stateHistoryPopulation = {};
    this.countyLandArea = {};
    this.topologyData;
    this.startYear = 2010; //The year th at the slider starts at

    this.stateVis;

    //Get the current selected radio button
    this.selectedData = document.querySelector(
      'input[name="radio_buttons"]:checked'
    ).value;

    // will fire when everything has loaded. This is the main point of entry
    $.when(this.loadCounties(), this.loadStatePop(), this.loadMap()).done(
      () => {
        this.stateVis = new State(
          this.stateName,
          this.topologyData,
          this.stateHistoryPopulation,
          this.startYear,
          this.countyPopulation,
          this.selectedData
        );
      }
    );
  }

  /**
   * Load county-level population for each year of data
   * @returns
   */
  async loadCounties() {
    await this.loadLandArea();
    return $.ajax({
      method: "get",
      url: `/data/counties/${this.stateName}`,
      success: (data) => {
        Object.entries(data).forEach((d) => {
          const county_id = d[1].fips;
          const county_name = d[1].county;

          //Add county population data for each year
          d[1].years.forEach((d) => {
            let percentIncrease = 1;
            if (+d.year > 2010) {
              let increase =
                d.population -
                this.countyPopulation[2010][county_id].population;
              percentIncrease = +(
                (increase / this.countyPopulation[2010][county_id].population) *
                100
              ).toFixed(2);
            }

            const squareMiles =
              d.population / this.countyLandArea[county_id].mileage;

            if (this.countyPopulation[d.year] === undefined) {
              this.countyPopulation[d.year] = {};
              this.countyPopulation[d.year]["lowest_population"] =
                Number.MAX_SAFE_INTEGER;
              this.countyPopulation[d.year]["highest_population"] =
                Number.MIN_SAFE_INTEGER;
              this.countyPopulation[d.year]["lowest_percent_change"] =
                Number.MAX_SAFE_INTEGER;
              this.countyPopulation[d.year]["highest_percent_change"] =
                Number.MIN_SAFE_INTEGER;
              this.countyPopulation[d.year]["smallest_landarea"] =
                Number.MAX_SAFE_INTEGER;
              this.countyPopulation[d.year]["largest_landarea"] =
                Number.MIN_SAFE_INTEGER;
            }

            this.countyPopulation[d.year][county_id] = {
              name: county_name,
              population: d.population,
              percentIncrease: percentIncrease,
              pop_per_sqmiles: squareMiles,
              mileage: this.countyLandArea[county_id].mileage,
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

            if (
              percentIncrease >
              this.countyPopulation[d.year]["highest_percent_change"]
            )
              this.countyPopulation[d.year]["highest_percent_change"] =
                percentIncrease;

            if (
              percentIncrease <
              this.countyPopulation[d.year]["lowest_percent_change"]
            )
              this.countyPopulation[d.year]["lowest_percent_change"] =
                percentIncrease;

            if (
              squareMiles < this.countyPopulation[d.year]["smallest_landarea"]
            )
              this.countyPopulation[d.year]["smallest_landarea"] = squareMiles;

            if (squareMiles > this.countyPopulation[d.year]["largest_landarea"])
              this.countyPopulation[d.year]["largest_landarea"] = squareMiles;

            this.countyPopulation[d.year]["year"] = d.year;
          });
        });
      },
    });
  }

  async loadLandArea() {
    return $.ajax({
      method: "get",
      url: `/data/county-land-area/${this.stateName}`,
      success: (data) => {
        Object.entries(data).forEach((d) => {
          this.countyLandArea[d[1].fips] = {
            countyID: d[1].fips,
            name: d[1].county,
            mileage: d[1]["square miles"],
          };
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
    this.stateVis.setSelectedData(this.selectedData);
    this.updateLegend();

    this.stateVis.assignPopData(
      this.countyPopulation[slider.value],
      this.stateHistoryPopulation[slider.value],
      slider.value
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
