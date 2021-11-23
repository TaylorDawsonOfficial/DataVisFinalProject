
/*
  Slider code
*/
const slider = document.querySelector(".slider");
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

class Data {
  constructor() {
    this.topologyData;
    this.populationData = {};
    this.populationList = {};

    this.state;
    this.country;
    this.countryBarChart;
    this.selectedChart;


    // will fire when we have retrieved all our data
    $.when(this.loadMap(), this.loadStatePopulation()).done(() => {
      this.initalizeVisualization();
    });
  }

  loadMap() {
    return $.ajax({
      method: "get",
      url: "/data/topology",
      success: data => {
        this.topologyData = data[0];
      }
    });
  }

  loadStatePopulation() {
    return $.ajax({
      method: "get",
      url: "/data/population",
      success: data => {
        for (let year of data[0].years) {
          this.populationData[year.year] = {};
          this.populationList[year.year] = [];
        }

        //Loop through each state to get population data
        for (let state of data) {
          //Add population data for each year for each state
          for (let year of state.years) {
            this.populationData[year.year][state.state.replaceAll(" ", "")] =
              year.population;
            this.populationList[year.year].push({
              state: state.state,
              population: year.population
            })
          }
        }

        //Do one final loop through and calculate population total for each year
        Object.entries(this.populationData).forEach(function (year) {
          let total = 0;
          for (let population of Object.entries(year[1])) {
            total += population[1];
          }

          year[1]["total_population"] = total;
        });
      }
    });
  }


  // when entering the app you should see the map visualization
  initalizeVisualization() {
    this.country = new Country(this.topologyData, this.populationData[slider.value]);
    this.countryBarChart = new CountryBarChart(this.populationList[slider.value]);
  }


  assignPopData() {
    this.country.assignPopData(this.populationData[slider.value]);
    this.countryBarChart.assignPopData(this.populationList[slider.value]);
  }


  // when clicking on a state, create a new state object
  openStateView(stateObj) {
    this.state = new State(stateObj);
    $(".state-graphs").css("flex", "1");
  }

  closeStateView() {
    this.country.fillState(this.state.stateObj.id);
    $(".state-graphs").css("flex", "0");
  }
}


let Vis;

/*
  Sets up values on HTML page after page has loaded
*/
$(document).ready(function () {
  initializeSlider();
  Vis = new Data();

  Vis.selectedChart = $("input[name='vis-options']:checked").val();
  $('#vis-option').change(function () {
    $(`#svg-${Vis.selectedChart}`).css("display", "none");
    Vis.selectedChart = $("input[name='vis-options']:checked").val();
    $(`#svg-${Vis.selectedChart}`).css("display", "");
  })
})