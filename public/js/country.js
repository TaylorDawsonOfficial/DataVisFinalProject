class Country {
  constructor(topologyData, initialYearData) {
    this.width = 960;
    this.height = 500;

    let states = topojson.feature(topologyData, topologyData.objects.states).features;
    this.setupSvg(states);
    this.assignPopData(initialYearData);
  }

  fillState(id, color = "") {
    $(`#${id}`).css("fill", color);
  }

  setupSvg(paths) {
    const svg = d3
      .select(".visualization")
      .append("svg")
      .attr("x", 0)
      .attr("y", 0)
      .attr("id", "svg-map")
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
      .on("click", (event, d) => {
        let newState = d.properties.name;
        console.log(newState);
      });
  }

  /*
    Updates the current population data based on the selected year in the slider
  */
  assignPopData(currentYearData) {
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
}

