class Data {
  constructor() {
    this.topologyData;
    this.landAreaData = {};
    this.populationData = {};
    this.populationList = {};

    this.landAreaPopulationList = {};

    this.state;
    this.country;
    this.countryBarChart;
    this.selectedChart;

    //Set selected radio button to default, which is percentage of total population
    document.querySelector("#radio_3").checked = true;

    //Get the current selected radio button
    this.selectedData = document.querySelector(
      'input[name="radio_buttons"]:checked'
    ).value;

    // will fire when we have retrieved all our data
    $.when(this.loadMap(), this.loadStatePopulation()).done(() => {
      this.initalizeVisualization();
    });
  }

  loadMap() {
    return $.ajax({
      method: "get",
      url: "/data/topology",
      success: (data) => {
        this.topologyData = data[0];
      },
    });
  }

  async loadLandArea() {
    this.landAreaData = {};
    return $.ajax({
      method: "get",
      url: "/data/state-land-area",
      success: (data) => {
        data.forEach((x) => {
          this.landAreaData[x.state] = x["square miles"];
        });
      },
    });
  }

  async loadStatePopulation() {
    await this.loadLandArea();

    return $.ajax({
      method: "get",
      url: "/data/population",
      success: (data) => {
        for (let year of data[0].years) {
          this.populationData[year.year] = {};
          this.populationList[year.year] = [];
          this.landAreaPopulationList[year.year] = [];
        }

        //Loop through each state to get population data
        for (let state of data) {
          const stateName = state.state.replaceAll(" ", "");
          //Add population data for each year for each state
          for (let year of state.years) {
            let percentIncrease = 1;
            if (+year.year > 1969) {
              percentIncrease = (
                (year.population /
                  this.populationData[1969][stateName].population) *
                100
              ).toFixed(2);
            }

            this.populationData[year.year][stateName] = {
              population: year.population,
              percent_increase: percentIncrease,
            };
            this.populationList[year.year].push({
              state: state.state,
              population: year.population,
            });

            this.landAreaPopulationList[year.year].push({
              state: state.state,
              population: year.population / this.landAreaData[state.state],
            });
          }
        }

        let smallest_pop = Number.MAX_SAFE_INTEGER;
        let largest_pop = Number.MIN_SAFE_INTEGER;
        let smallest_percent_increase = Number.MAX_SAFE_INTEGER;
        let largest_percent_increase = Number.MIN_SAFE_INTEGER;

        const temp = this;

        //Do one final loop through and calculate population total for each year
        Object.entries(this.populationData).forEach(function (year) {
          let total = 0;
          for (let population of Object.entries(year[1])) {
            const newPop = population[1].population;
            const newPcntInc = +population[1].percent_increase;
            total += newPop;
            if (newPop < smallest_pop) {
              smallest_pop = newPop;
            }

            if (newPop > largest_pop) {
              largest_pop = newPop;
            }

            if (newPcntInc > largest_percent_increase) {
              largest_percent_increase = newPcntInc;
            }

            if (newPcntInc < smallest_percent_increase) {
              smallest_percent_increase = newPcntInc;
            }
          }

          year[1]["total_population"] = total;
          year[1]["smallest_population"] = smallest_pop;
          year[1]["largest_population"] = largest_pop;
          year[1]["smallest_percent_increase"] = smallest_percent_increase;
          year[1]["largest_percent_increase"] = largest_percent_increase;
        });
      },
    });
  }

  // when entering the app you should see the map visualization
  initalizeVisualization() {
    this.country = new Country(
      this.topologyData,
      this.populationData[slider.value],
      this.selectedData
    );
    this.countryBarChart = new CountryBarChart(
      this.populationList[slider.value]
    );
  }

  assignPopData() {
    this.country.setSelectedData(this.selectedData);
    Vis.updateLegend();

    if (this.selectedData === "total-pop") {
      this.countryBarChart.assignPopData(this.populationList[slider.value]);
      this.country.assignPopData(this.populationList[slider.value]);
    } else if (this.selectedData === "square-mile") {
      this.countryBarChart.assignPopData(
        this.landAreaPopulationList[slider.value]
      );
      this.country.assignPopData(this.landAreaPopulationList[slider.value]);
    } else {
      //Covers percentage of total population and population increase since 1969
      this.country.assignPopData(this.populationData[slider.value]);
    }
  }

  updateLegend() {
    if (this.selectedData === "total-pop") {
      this.country.updateLegend(this.populationList[slider.value]);
    } else if (this.selectedData === "square-mile") {
      this.country.updateLegend(this.landAreaPopulationList[slider.value]);
    } else {
      //Covers percentage of total population and population increase since 1969
      this.country.updateLegend(this.populationData[slider.value]);
    }
  }
}
let Vis;

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
  Vis.assignPopData();
};

function initializeSlider() {
  slider.min = 1969;
  slider.max = 2019;
  slider.value = slider.min;
  output.innerHTML = slider.value;
}

/*
  Sets up values on HTML page after page has loaded
*/
$(document).ready(function () {
  initializeSlider();
  Vis = new Data();

  // set navbar link to active
  $("#home").addClass("active");

  // watch the view select
  Vis.selectedChart = $("#vis-option option:selected").val();
  $("#sort-by-container").hide();
  $("#vis-option").change(() => {
    $(`#svg-${Vis.selectedChart}`).hide();
    Vis.selectedChart = $("#vis-option option:selected").val();
    $(`#svg-${Vis.selectedChart}`).show();

    if (Vis.selectedChart === "map") {
      $("#sort-by-container").hide();
    } else if (Vis.selectedChart === "bar") {
      $("#sort-by-container").show();
    }
  });

  // watch the button change
  $("#radio-buttons").change(() => {
    Vis.selectedData = $("input[name='radio_buttons']:checked").val();
    Vis.assignPopData();
  });
});
