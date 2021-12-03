class State {
  constructor(
    stateName,
    topologyData,
    stateData,
    dataStartYear,
    countyData,
    startingData
  ) {
    this.stateName = stateName;
    this.countyPopulationData = countyData;
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
    this.minAxisValue;
    this.maxAxisValue;
    this.stateSVG;
    this.legendWidth = 800;
    this.legendHeight = 25;
    this.selectedData = startingData;

    let key = Object.keys(topologyData.objects)[0];
    let state = topojson.feature(topologyData, topologyData.objects[key]);

    //Create SVG for state map display
    this.setupSvg(
      state,
      this.countyPopulationData[dataStartYear],
      stateData[dataStartYear]
    );

    //Assign population data to state map
    this.assignPopData(
      this.countyPopulationData[dataStartYear],
      stateData[dataStartYear]
    );

    //Chart1: Create line chart for state's population from 1969
    new StateTotal(stateName, stateData);

    //Chart 2: Create scatter plot for relation from population to square miles
    this.countyScatterPlot = new CountyScatterPlot(
      this.countyPopulationData[dataStartYear],
      (x) => this.dataIsNotFilteredValue(x)
    );

    //Chart 3: Create area chart for counties population
    this.countyTotal = new CountyTotal(this.countyPopulationData);
    console.log("Graph 3: ", this.countyPopulationData);
  }

  fillCounty(county, population_percentage) {
    $(`.${county}`).css("fill", this.mapColorFill(population_percentage));
  }

  setupSvg(state, countyPopData, totalStatePopulation) {
    this.stateSVG = d3
      .select(".visualization")
      .append("svg")
      .attr("x", 0)
      .attr("y", 0)
      .attr("id", "svg-state-map");

    this.stateSVG
      .attr("viewBox", `0 0 ${this.width} ${this.height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // have to do a separate svg on the states because the states are all different sizes and can overlap with it
    this.legendSVG = d3
      .select(".visualization")
      .append("svg")
      .attr("x", 0)
      .attr("y", 0)
      .attr("id", "svg-state-map-legend")
      .attr("viewBox", `0 0 ${this.width} ${this.legendHeight + 30}`)
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

    this.stateSVG
      .selectAll(".county")
      .data(state.features)
      .enter()
      .append("path")
      .attr("class", (d) => {
        return `county county__${d.properties.GEOID}`;
      })
      .attr("d", path)
      .attr("id", (d) => {
        return d.properties.GEOID;
      }) // this GEOID maps back to the fips code in the countyPopulation data. You can use it as a key to get the population data
      .on("click", (e, d) => {
        this.countyTotal.drawChart(d.properties.GEOID);
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
    let tickFormat;
    switch (this.selectedData) {
      case "total-pop":
        this.minAxisValue = +(
          (countyPopData["lowest_population"] / totalStatePopulation) *
          100
        ).toFixed(2);
        this.maxAxisValue = +(
          (countyPopData["highest_population"] / totalStatePopulation) *
          100
        ).toFixed(2);
        tickFormat = (x) => x.toFixed(2) + "%";
        break;
      case "square-mile":
        this.minAxisValue = +countyPopData["smallest_landarea"].toFixed(2);
        this.maxAxisValue = +countyPopData["largest_landarea"].toFixed(2);

        tickFormat = (x) => x.toFixed(2);
        break;
      case "pop-increase":
        this.minAxisValue = +countyPopData["lowest_percent_change"].toFixed(2);
        this.maxAxisValue = +countyPopData["highest_percent_change"].toFixed(2);

        tickFormat = (x) => x.toFixed(2) + "%";
        break;
    }

    //Legend data
    this.mapColorFill.domain([this.minAxisValue, this.maxAxisValue]);

    let fillRange = [];
    for (let i = 0; i <= this.mapColors.length; i++) {
      fillRange.push((this.legendWidth / this.mapColors.length) * i);
    }

    let legendAxisScale = d3.scaleQuantile().range(fillRange);

    let diff;

    if (this.minAxisValue < 0)
      diff = (this.maxAxisValue + this.minAxisValue) / this.mapColors.length;
    else diff = (this.maxAxisValue - this.minAxisValue) / this.mapColors.length;

    let legendScale = [];
    legendScale.push(this.minAxisValue);
    for (let i = 0; i < this.mapColors.length - 1; i++) {
      if (this.minAxisValue < 0)
        legendScale.push(diff * (i + 1) - +this.minAxisValue);
      else legendScale.push(diff * (i + 1) + +this.minAxisValue);
    }

    legendScale.push(this.maxAxisValue);

    legendAxisScale.domain(legendScale);

    d3.selectAll(".axis__legend").remove();

    let legendAxis = d3.axisBottom(legendAxisScale).tickFormat(tickFormat);

    let legend = this.legendSVG
      .selectAll(".legend")
      .data(this.mapColors)
      .enter()
      .append("g")
      .attr("transform", `translate(75,0)`);

    legend
      .append("rect")
      .attr("width", this.legendWidth / this.mapColors.length)
      .attr("height", this.legendHeight)
      .style("fill", (d) => d)
      .attr("x", (d, i) => (this.legendWidth / this.mapColors.length) * i);

    this.legendSVG
      .append("g")
      .attr("class", "axis axis__legend")
      .attr("transform", `translate(75, ${this.legendHeight})`)
      .call(legendAxis);
  }

  /*
    Updates the current population data based on the selected year in the slider
  */
  assignPopData(county_data, state_population) {
    //Loop through all states and update display based on population data
    const stateObject = this;

    switch (this.selectedData) {
      case "total-pop":
        Object.entries(county_data).forEach(function (data) {
          if (!stateObject.dataIsNotFilteredValue(data[0])) {
            const pop_percentage =
              (data[1].population / state_population) * 100;

            const countySelector = `county__${data[0]}`;

            d3.select(`.${countySelector}`).attr("fill", () =>
              stateObject.fillCounty(countySelector, pop_percentage)
            );
          }
        });
        break;
      case "pop-increase":
        Object.entries(county_data).forEach(function (data) {
          if (!stateObject.dataIsNotFilteredValue(data[0])) {
            const countySelector = `county__${data[0]}`;

            d3.select(`.${countySelector}`).attr("fill", () =>
              stateObject.fillCounty(countySelector, +data[1].percentIncrease)
            );
          }
        });
        break;
      case "square-mile":
        Object.entries(county_data).forEach(function (data) {
          if (!stateObject.dataIsNotFilteredValue(data[0])) {
            const countySelector = `county__${data[0]}`;
            d3.select(`.${countySelector} `).attr("fill", () =>
              stateObject.fillCounty(countySelector, +data[1].pop_per_sqmiles)
            );
          }
        });
        break;
    }

    //Create scatter plot for currently selected year
    if (this.countyScatterPlot) {
      this.countyScatterPlot.updateCircles(county_data);
    }
  }

  formatPopulationOnAxis(value) {
    return d3.format("~s")(value);
  }

  setSelectedData(newSelection) {
    this.selectedData = newSelection;
  }

  dataIsNotFilteredValue(valueToTest) {
    return (
      valueToTest === "highest_percent_change" ||
      valueToTest === "highest_population" ||
      valueToTest === "lowest_percent_change" ||
      valueToTest === "lowest_population" ||
      valueToTest === "total_population" ||
      valueToTest === "landarea" ||
      valueToTest === "smallest_landarea" ||
      valueToTest === "largest_landarea" ||
      valueToTest === "year"
    );
  }
}
