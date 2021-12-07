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
    this.sequentialColors = [
      "#f7f7f7",
      "#e1dce4",
      "#cac0d1",
      "#b4a5be",
      "#9d89ab",
      "#876e97",
      "#705284",
      "#5a3771",
      "#431b5e",
      "#2d004b",
    ];
    this.divergingColors = [
      "#b35806",
      "#bc691c",
      "#c67a32",
      "#cf8b48",
      "#d99c5e",
      "#e2ad74",
      "#ebbe8a",
      "#f5cfa0",
      "#fee0b6"
    ]
    this.mapColorFill;
    this.minAxisValue;
    this.maxAxisValue;
    this.stateSVG;
    this.legendWidth = 800;
    this.legendHeight = 25;
    this.selectedData = startingData;
    this.currentData;
    this.highlightedColor = "red";
    this.hoveredCountyColor;
    this.hoveredCountyID;

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
      (x) => this.dataIsNotFilteredValue(x), this
    );

    //Chart 3: Create area chart for counties population
    this.countyTotal = new CountyTotal(this.countyPopulationData);
  }

  fillCounty(county, population_percentage) {
    $(`.${county}`).css("fill", this.mapColorFill(population_percentage));
  }

  getHelpText(key) {
    let name = this.currentData[key].name;
    if (this.selectedData === "total-pop") {
      return `${name} Population: ${this.currentData[key].population.toLocaleString("en-US")}`;
    }
    else if (this.selectedData === "square-mile") {
      return `${name} Population Per</br>Square Mile: ${this.currentData[key].pop_per_sqmiles.toFixed(2).toLocaleString("en-US")}`;
    }
    else if (this.selectedData === "pop-increase") {
      return `${name} Population Increase</br>Since 2010: ${this.currentData[key].percentIncrease}%`;
    }
  }

  setupSvg(state, countyPopData, totalStatePopulation) {

    // Inspiration for the hoverable tooltip was gathered from here: https://bl.ocks.org/d3noob/a22c42db65eb00d4e369
    let tooltip = d3.select(".visualization").append("div")
      .attr("class", "tooltip invisible")

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

    let self = this;
    let hoveredColor;

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
      })
      .on("mouseover", function (event, d) {
        hoveredColor = d3.select(this).style("fill");
        d3.select(this).style("fill", self.highlightedColor);
        self.countyScatterPlot.fillDot(`scatplot__${d.properties.GEOID}`, self.highlightedColor);
        tooltip
          .html(self.getHelpText(d.properties.GEOID))
          .attr("class", "tooltip visible")
          .style("left", `${event.x}px`)
          .style("top", `${event.y}px`);
      })
      .on("mouseout", function (event, d) {
        self.countyScatterPlot.refillDot(`scatplot__${d.properties.GEOID}`);
        d3.select(this).style("fill", hoveredColor);
        tooltip.attr("class", "tooltip invisible");
      });

    this.createLegend(countyPopData, totalStatePopulation);
  }

  /**
   * Creates Legend element and appends to Country SVG
   * @param {} populationData
   */
  createLegend(countyPopData, totalStatePopulation) {
    this.updateLegend(countyPopData, totalStatePopulation);
  }

  /**
   * Updated legend axis scale with new values from chosen year
   */
  updateLegend(countyPopData, totalStatePopulation) {
    this.currentData = countyPopData;
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
    let legendScale = [];
    let mapColors;

    if (this.minAxisValue < 0) {
      let diff = (this.maxAxisValue - this.minAxisValue) / (this.sequentialColors.length - 1);
      let zeroIndex;
      for (let i = 0; i < this.sequentialColors.length - 1; i++) {
        let val = diff * i + +this.minAxisValue;
        if (val >= 0) {
          zeroIndex = i;
          break;
        }
      }

      mapColors = [];
      let negativeDiff = Math.abs(this.minAxisValue) / zeroIndex;
      for (let i = 0; i < zeroIndex; i++) {
        legendScale.push(negativeDiff * i + this.minAxisValue)
        mapColors.push(this.divergingColors[this.divergingColors.length - zeroIndex + i])
      }
      legendScale.push(0);

      let positiveDiff = this.maxAxisValue / (this.sequentialColors.length - zeroIndex)
      for (let i = zeroIndex + 1; i <= this.sequentialColors.length; i++) {
        legendScale.push(positiveDiff * (i - zeroIndex));
        mapColors.push(this.sequentialColors[i - zeroIndex - 1]);
      }
    }
    else {
      mapColors = this.sequentialColors;
      let diff = (this.maxAxisValue - this.minAxisValue) / this.sequentialColors.length;
      for (let i = 0; i < this.sequentialColors.length; i++) {
        legendScale.push(diff * i - +this.minAxisValue);
      }
      legendScale.push(this.maxAxisValue);
    }



    this.mapColorFill = d3.scaleQuantile().range(mapColors);
    this.mapColorFill.domain(legendScale);

    let fillRange = [];
    for (let i = 0; i <= this.sequentialColors.length; i++) {
      fillRange.push((this.legendWidth / this.sequentialColors.length) * i);
    }

    let legendAxisScale = d3.scaleQuantile().range(fillRange);
    legendAxisScale.domain(legendScale);

    d3.selectAll(".axis__legend").remove();

    let legendAxis = d3.axisBottom(legendAxisScale).tickFormat(tickFormat);

    let legend = this.legendSVG
      .selectAll(".legend")
      .data(mapColors)
      .enter()
      .append("g")
      .attr("transform", `translate(75,0)`);

    legend
      .append("rect")
      .attr("width", this.legendWidth / this.sequentialColors.length)
      .attr("height", this.legendHeight)
      .style("fill", (d) => d)
      .attr("x", (d, i) => (this.legendWidth / this.sequentialColors.length) * i);

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

  fillHoveredCounty(countyClassID){
    this.hoveredCountyID = countyClassID;
    this.hoveredCountyColor = $(`.${countyClassID}`).css("fill");
    $(`.${countyClassID}`).css("fill", this.highlightedColor);
  }

  refillHoveredCounty(){
    $(`.${this.hoveredCountyID}`).css("fill", this.hoveredCountyColor);
  }
}
