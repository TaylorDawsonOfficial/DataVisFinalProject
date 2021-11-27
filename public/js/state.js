class State {
  constructor(stateName, topologyData, stateData, countyData) {
    this.stateName = stateName;
    this.width = 960;
    this.height = 500;
    // this.mapColors = ["#f2f0f7", "#cbc9e2", "#9e9ac8", "#756bb1", "#54278f"];
    this.mapColors = [
      "#f3f0ff",
      "#e5dbff",
      "#d0bfff",
      "#b197fc",
      "#9775fa",
      "#845ef7",
      "#7950f2",
      "#7048e8",
      "#6741d9",
      "#5f3dc4",
    ];
    this.mapColorFill;
    this.minPopPercent;
    this.maxPopPercent;
    this.stateSVG;
    this.legendWidth = 400;
    this.legendHeight = 20;

    let key = Object.keys(topologyData.objects)[0];
    let state = topojson.feature(topologyData, topologyData.objects[key]);
    this.setupSvg(state, countyData, stateData);

    this.assignPopData(countyData, stateData);
  }

  fillCounty(county, population_percentage) {
    $(`.${county}`).css("fill", this.mapColorFill(population_percentage));
  }

  setupSvg(state, countyPopData, totalStatePopulation) {
    this.stateSVG = d3
      .select(".visualization")
      .append("div")
      .attr("class", "map_container")
      .append("svg")
      .attr("x", 0)
      .attr("y", 0)
      .attr("id", "svg-state-map");

    this.stateSVG
      .attr("viewBox", `0 0 ${this.width} ${this.height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // this.stateSVG = d3
    //   .select(".visualization")
    //   .append("div")
    //   .attr("class", "legend_container");

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

    this.stateSVG
      .selectAll(".county")
      .data(state.features)
      .enter()
      .append("path")
      .attr("class", (d) => {
        // console.log(d.properties.NAME, d.properties.GEOID);
        return `county county__${d.properties.GEOID}`;
      })
      .attr("d", path)
      .attr("id", (d) => {
        return d.properties.GEOID;
      }) // this GEOID maps back to the fips code in the countyPopulation data. You can use it as a key to get the population data
      .on("mouseover", (e, d) => {
        console.log(d);
      });

    this.createLegend(countyPopData, totalStatePopulation);
  }

  /**
   * Creates Legend element and appends to Country SVG
   * @param {} populationData
   */
  createLegend(countyPopData, totalStatePopulation) {
    this.mapColorFill = d3.scaleQuantile().range(this.mapColors);

    this.updateLegend(countyPopData, totalStatePopulation);
  }

  /**
   * Updated legend axis scale with new values from chosen year
   */
  updateLegend(countyPopData, totalStatePopulation) {
    this.minPopPercent = +(
      (countyPopData["lowest_population"] / totalStatePopulation) *
      100
    ).toFixed(2);
    this.maxPopPercent = +(
      (countyPopData["highest_population"] / totalStatePopulation) *
      100
    ).toFixed(2);

    //Legend data
    this.mapColorFill.domain([this.minPopPercent, this.maxPopPercent]);

    let fillRange = [];
    for (let i = 0; i <= this.mapColors.length; i++) {
      fillRange.push((this.legendWidth / this.mapColors.length) * i);
    }

    let legendAxisScale = d3.scaleQuantile().range(fillRange);

    let diff =
      (this.maxPopPercent - this.minPopPercent) / this.mapColors.length;
    let legendScale = [];
    legendScale.push(this.minPopPercent);
    for (let i = 0; i < this.mapColors.length - 1; i++) {
      legendScale.push(diff * (i + 1) + +this.minPopPercent);
    }

    legendScale.push(this.maxPopPercent);

    legendAxisScale.domain(legendScale);

    d3.selectAll(".axis__legend").remove();

    let legendAxis = d3
      .axisBottom(legendAxisScale)
      .tickFormat((x) => x.toFixed(2) + "%");

    let legend = this.stateSVG
      .selectAll(".legend")
      .data(this.mapColors)
      .enter()
      .append("g")
      .attr(
        "transform",
        `translate(${this.width - this.legendWidth - 15},${this.height - 140})`
      );

    legend
      .append("rect")
      .attr("width", this.legendWidth / this.mapColors.length)
      .attr("height", this.legendHeight)
      .style("fill", (d) => d)
      .attr("x", (d, i) => (this.legendWidth / this.mapColors.length) * i);

    this.stateSVG
      .append("g")
      .attr("class", "axis axis__legend")
      .attr(
        "transform",
        `translate(${this.width - this.legendWidth - 15},${this.height - 120})`
      )
      .call(legendAxis);
  }

  /*
    Updates the current population data based on the selected year in the slider
  */
  assignPopData(county_data, state_population) {
    //Loop through all states and update display based on population data
    const stateObject = this;

    Object.entries(county_data).forEach(function (data) {
      if (data[0] !== "lowest_population" && data[0] !== "highest_population") {
        const pop_percentage = (data[1] / state_population) * 100;

        const countySelector = `county__${data[0]}`;

        d3.select(`.${countySelector}`).attr("fill", () =>
          stateObject.fillCounty(countySelector, pop_percentage)
        );
      }
    });
  }
}
