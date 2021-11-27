class State {
  constructor(stateName, topologyData, stateData, countyData) {
    this.stateName = stateName;
    this.width = 960;
    this.height = 500;

    let key = Object.keys(topologyData.objects)[0];
    let state = topojson.feature(topologyData, topologyData.objects[key]);
    this.setupSvg(state);

    this.assignPopData(countyData, stateData);
  }

  setupSvg(state) {
    const svg = d3
      .select(".visualization")
      .append("svg")
      .attr("x", 0)
      .attr("y", 0)
      .attr("id", "svg-state-map")
      .attr("viewBox", `0 0 ${this.width} ${this.height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // for some reason Alaska is weird and looks small with geoMercator
    let projection;
    if (this.stateName.toLowerCase() === "alaska") {
      projection = d3.geoAlbersUsa().scale(1).translate([0, 0]);
    } else {
      projection = d3.geoMercator().scale(1).translate([0, 0]);
    }

    const path = d3.geoPath().projection(projection);

    // Got this code from Isaac Cho's lecture on 11/22/21
    const b = path.bounds(state),
      s =
        0.95 /
        Math.max(
          (b[1][0] - b[0][0]) / this.width,
          (b[1][1] - b[0][1]) / this.height
        ),
      t = [
        (this.width - s * (b[1][0] + b[0][0])) / 2,
        (this.height - s * (b[1][1] + b[0][1])) / 2,
      ];

    projection.scale(s).translate(t);

    svg
      .selectAll(".county")
      .data(state.features)
      .enter()
      .append("path")
      .attr(
        "class",
        // Number(("text-1324").match(/\d+$/))
        (d) => {
          return `county ${d.properties.NAME.replace(
            /[^a-zA-Z0-9 !?]+/g,
            ""
          ).replaceAll(" ", "")}County`;
        }
      )
      .attr("d", path)
      .attr("id", (d) => {
        return d.properties.GEOID;
      }) // this GEOID maps back to the fips code in the countyPopulation data. You can use it as a key to get the population data
      .on("mouseover", (e, d) => {
        console.log(d);
      });
  }

  /*
    Updates the current population data based on the selected year in the slider
  */
  assignPopData(county_data, state_population) {
    /*
        If greater than 10% population, full opacity
        if greater than 7% population, 70% opacity
        if greater than 5% population, 50% opacity
        if greater than 3% population, 30% opacity
        if greater than 1% population, 10% opacity 
      */

    //Loop through all states and update display based on population data
    // console.log(county_data, state_population);
    Object.entries(county_data).forEach(function (data) {
      let opacity = 0;

      const pop_percentage = (data[1] / state_population) * 100;
      if (pop_percentage > 10) {
        opacity = 1;
      } else {
        opacity = pop_percentage / 10;
      }

      d3.select(`.${data[0]}`)
        .attr("fill", "green")
        .attr("fill-opacity", opacity);
    });
  }
}
