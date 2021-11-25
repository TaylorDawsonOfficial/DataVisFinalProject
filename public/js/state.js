class State {
  constructor(stateName, topologyData, stateHistoryPopulation) {
    this.stateName = stateName;
    this.width = 960;
    this.height = 500;

    let key = Object.keys(topologyData.objects)[0];
    let state = topojson.feature(topologyData, topologyData.objects[key]);
    this.setupSvg(state);
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
    }
    else {
      projection = d3.geoMercator().scale(1).translate([0, 0]);
    }

    const path = d3.geoPath().projection(projection);

    // Got this code from Isaac Cho's lecture on 11/22/21
    const b = path.bounds(state),
      s = 0.95 / Math.max((b[1][0] - b[0][0]) / this.width, (b[1][1] - b[0][1]) / this.height),
      t = [(this.width - s * (b[1][0] + b[0][0])) / 2, (this.height - s * (b[1][1] + b[0][1])) / 2];

    projection.scale(s).translate(t);

    svg
      .selectAll(".county")
      .data(state.features)
      .enter()
      .append("path")
      .attr("class", "county")
      .attr("d", path)
      .attr("id", d => { return d.properties.GEOID }) // this GEOID maps back to the fips code in the countyPopulation data. You can use it as a key to get the population data
      .on('mouseover', (e, d) => { console.log(d) });
  }
}