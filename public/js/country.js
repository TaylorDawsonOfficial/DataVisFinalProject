class Country {
  constructor() {
    this.width = 960;
    this.height = 500;
    this.selectedColor = "lightpink";
    this.selectedState;
    this.data;
    this.population_data = {};
    this.earliest_year = 3000;
    this.latest_year = 1900;

    $.ajax({
      method: "get",
      url: "/data/topology",
      success: (data) => {
        this.data = data[0];
        let states = topojson.feature(
          this.data,
          this.data.objects.states
        ).features;
        this.setupSvg(states);
      },
    });

    //Initialize population data
    $.ajax({
      method: "get",
      url: "/data/population",
      success: (pop_data) => {
        //Loop through one state to get the total year range
        for (let year of pop_data[0].years) {
          this.population_data[year.year] = {};
          if (year.year < this.earliest_year) {
            this.earliest_year = year.year;
          }

          if (year.year > this.latest_year) {
            this.latest_year = year.year;
          }
        }

        //Loop through each state to get population data
        for (let state of pop_data) {
          let year_pop = [];

          //Add population data for each year for each state
          for (let year of state.years) {
            this.population_data[year.year][state.state.replaceAll(" ", "")] =
              year.population;
          }
        }

        //Do one final loop through and calculate population total for each year
        Object.entries(this.population_data).forEach(function (year) {
          let total = 0;
          for (let population of Object.entries(year[1])) {
            total += population[1];
          }

          year[1]["total_population"] = total;
        });

        assignPopData(this.earliest_year);
      },
    });
  }

  fillState(id, color = "") {
    $(`#${id}`).css("fill", color);
  }

  setupSvg(paths) {
    const svg = d3
      .select(".country-container")
      .append("svg")
      .attr("x", 0)
      .attr("y", 0)
      .attr("viewBox", `0 0 ${this.width} ${this.height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const projection = d3.geoAlbersUsa();
    const path = d3.geoPath().projection(projection);

    svg
      .selectAll(".state")
      .data(paths)
      .enter()
      .append("path")
      .attr("class", (d) => `state ${d.properties.name.replaceAll(" ", "")}`) //Adds both state and name of state as a class
      .attr("d", path)
      .attr("id", (d) => {
        return d.id;
      })
      .on("click", (d, i) => {
        let newState = i.properties.name;
        if (this.selectedState && this.selectedState !== newState) {
          this.fillState(this.selectedState);
        }
        this.selectedState = i.id;
        Map.selectedStateChanged(i);
        this.fillState(this.selectedState, this.selectedColor);
      });
  }

  getCurrentYearData(year) {
    return this.population_data[year];
  }
}

/*
  Updates the current population data based on the selected year in the slider
*/
function assignPopData(selected_year) {
  const currentYearData = Map.Country.getCurrentYearData(selected_year);

  /*
    If greater than 10% population, full opacity
    if greater than 7% population, 70% opacity
    if greater than 5% population, 50% opacity
    if greater than 3% population, 30% opacity
    if greater than 1% population, 10% opacity 
  */

  //Loop through all states and update display based on population data
  Object.entries(currentYearData).forEach(function (data) {
    if (data[0] !== "total_population") {
      let opacity = 0;

      const pop_percentage =
        (data[1] / currentYearData["total_population"]) * 100;
      if (pop_percentage > 10) {
        opacity = 1;
      } else {
        opacity = pop_percentage / 10;
      }

      d3.select(`.${data[0]}`)
        .attr("fill", "green")
        .attr("fill-opacity", opacity);
    }
  });
}

/*
    Sets up values on HTML page after page has loaded
  */
document.addEventListener(
  "DOMContentLoaded",
  function () {
    initializeSlider();
  },
  false
);

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
  assignPopData(this.value);
};

function initializeSlider() {
  slider.min = 1969;
  slider.max = 2019;
  slider.value = slider.min;
  output.innerHTML = slider.value;
}

function getSliderValue() {
  return slider.value;
}
