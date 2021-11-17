class Country {
  constructor() {
    this.width = 960;
    this.height = 500;
    this.selectedColor = "lightpink";
    this.selectedState;
    this.data;
    this.population_data = [];

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
        assignPopData();
      },
    });

    //Initialize population data
    $.ajax({
      method: "get",
      url: "/data/population",
      success: (pop_data) => {
        for (let entry of pop_data) {
          // console.log(entry.years, slider.value);
          let year_pop = [];

          for (let year of entry.years) {
            year_pop.push({ year: year.year, population: year.population });
          }

          this.population_data[entry.state] = year_pop;
        }
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
}

function assignPopData() {
  console.log(Map.Country.population_data);
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
  assignPopData();
};

function initializeSlider() {
  slider.min = 1969;
  slider.max = 2019;
  slider.value = 1969;
  output.innerHTML = slider.value;
}

function getSliderValue() {
  return slider.value;
}
