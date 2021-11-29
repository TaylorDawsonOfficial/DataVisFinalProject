class Country {
  constructor(topologyData, initialYearData, selectedDataType) {
    this.width = 960;
    this.height = 600;
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
    this.countrySVG;
    this.legendWidth = 800;
    this.legendHeight = 25;
    this.selectedData = selectedDataType;
    this.currentData;

    let states = topojson.feature(
      topologyData,
      topologyData.objects.states
    ).features;
    this.setupSvg(states, initialYearData);
    this.assignPopData(initialYearData);
  }

  fillState(state, population_percentage) {
    $(`.${state}`).css("fill", this.mapColorFill(population_percentage));
  }

  getHelpText(name) {
    let key = name.replace(" ", "");
    if (this.selectedData === "total-pop") {
      return `${name} Population: ${this.currentData[key].population.toLocaleString("en-US")}`;
    }
    else if (this.selectedData === "square-mile") {
      return `${name} Population Per</br>Square Mile: ${this.currentData[key].landarea.toFixed(2).toLocaleString("en-US")}`;
    }
    else if (this.selectedData === "pop-increase") {
      return `${name} Population Increase</br>Since 1969: ${this.currentData[key].percent_increase}%`;
    }
  }

  setupSvg(paths, populationData) {
    // Inspiration for the hoverable tooltip was gathered from here: https://bl.ocks.org/d3noob/a22c42db65eb00d4e369
    let tooltip = d3.select(".visualization").append("div")
      .attr("class", "tooltip invisible")

    this.countrySVG = d3
      .select(".visualization")
      .append("svg")
      .attr("x", 0)
      .attr("y", 0)
      .attr("id", "svg-map");

    this.countrySVG
      .attr("viewBox", `0 0 ${this.width} ${this.height} `)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const projection = d3.geoAlbersUsa();
    const path = d3.geoPath().projection(projection);

    let self = this;
    this.countrySVG
      .selectAll(".state")
      .data(paths)
      .enter()
      .append("path")
      .attr("class", (d) => `state ${d.properties.name.replaceAll(" ", "")} `) //Adds both state and name of state as a class
      .attr("d", path)
      .attr("id", (d) => {
        return d.id;
      })
      .on("click", (event, d) => {
        let newState = d.properties.name;
        window.location.href = `state/${newState.replace(" ", "-")}`;
      })
      .on("mouseover", function (event, d) {
        d3.select(this).style("fill-opacity", 0.5);
        tooltip
          .html(self.getHelpText(d.properties.name, populationData))
          .attr("class", "tooltip visible")
          .style("left", `${event.x}px`)
          .style("top", `${event.y}px`);
      })
      .on("mouseout", function (event, d) {
        d3.select(this).style("fill-opacity", 1);
        tooltip.attr("class", "tooltip invisible");
      })

    this.createLegend(populationData);
  }

  /**
   * Creates Legend element and appends to Country SVG
   * @param {} populationData
   */
  createLegend(populationData) {
    this.mapColorFill = d3.scaleQuantile().range(this.mapColors);

    this.updateLegend(populationData);
  }

  /**
   * Updated legend axis scale with new values from chosen year
   */
  updateLegend(populationData) {
    this.currentData = populationData;
    let tickFormat;
    switch (this.selectedData) {
      case "total-pop":
        this.minAxisValue = +(
          (populationData["smallest_population"] /
            populationData["total_population"]) *
          100
        ).toFixed(2);
        this.maxAxisValue = +(
          (populationData["largest_population"] /
            populationData["total_population"]) *
          100
        ).toFixed(2);

        tickFormat = (x) => x.toFixed(2) + "%";
        break;
      case "square-mile":
        this.minAxisValue =
          +populationData["smallest_landarea"].toFixed(2);
        this.maxAxisValue =
          +populationData["largest_landarea"].toFixed(2);

        tickFormat = (x) => x.toFixed(2);
        break;
      case "pop-increase":
        this.minAxisValue =
          +populationData["smallest_percent_increase"].toFixed(2);
        this.maxAxisValue =
          +populationData["largest_percent_increase"].toFixed(2);

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

    let diff = (this.maxAxisValue - this.minAxisValue) / this.mapColors.length;
    let legendScale = [];
    legendScale.push(this.minAxisValue);
    for (let i = 0; i < this.mapColors.length - 1; i++) {
      legendScale.push(diff * (i + 1) + +this.minAxisValue);
    }

    legendScale.push(this.maxAxisValue);

    legendAxisScale.domain(legendScale);

    d3.selectAll(".axis__legend").remove();

    let legendAxis = d3.axisBottom(legendAxisScale).tickFormat(tickFormat);

    let legend = this.countrySVG
      .selectAll(".legend")
      .data(this.mapColors)
      .enter()
      .append("g")
      .attr(
        "transform",
        `translate(${this.width - this.legendWidth - 75}, ${this.height - (this.legendHeight * 2)})`
      );

    legend
      .append("rect")
      .attr("width", this.legendWidth / this.mapColors.length)
      .attr("height", this.legendHeight)
      .style("fill", (d) => d)
      .attr("x", (d, i) => (this.legendWidth / this.mapColors.length) * i);

    this.countrySVG
      .append("g")
      .attr("class", "axis axis__legend")
      .attr(
        "transform",
        `translate(${this.width - this.legendWidth - 75}, ${this.height - this.legendHeight})`
      )
      .call(legendAxis);
  }

  /*
    Updates the current population data based on the selected year in the slider
  */
  assignPopData(currentYearData) {
    const countryObject = this;
    switch (this.selectedData) {
      case "total-pop":
        //Loop through all states and update display based on population data
        Object.entries(currentYearData).forEach(function (data) {
          if (!countryObject.dataIsNotFilteredValue(data[0])) {
            const pop_percentage =
              (data[1].population / currentYearData["total_population"]) * 100;
            d3.select(`.${data[0]} `).attr("fill", () =>
              countryObject.fillState(data[0], pop_percentage)
            );
          }
        });
        break;
      case "square-mile":
        Object.entries(currentYearData).forEach(function (data) {
          if (!countryObject.dataIsNotFilteredValue(data[0])) {
            d3.select(`.${data[0]} `).attr("fill", () =>
              countryObject.fillState(data[0], +data[1].landarea)
            );
          }
        });
        break;
      case "pop-increase":
        Object.entries(currentYearData).forEach(function (data) {
          if (!countryObject.dataIsNotFilteredValue(data[0])) {
            d3.select(`.${data[0]} `).attr("fill", () =>
              countryObject.fillState(data[0], +data[1].percent_increase)
            );
          }
        });
        break;
    }
  }

  setSelectedData(newDataType) {
    this.selectedData = newDataType;
  }

  dataIsNotFilteredValue(valueToTest) {
    return (
      valueToTest === "largest_percent_increase" ||
      valueToTest === "largest_population" ||
      valueToTest === "smallest_percent_increase" ||
      valueToTest === "smallest_population" ||
      valueToTest === "total_population" ||
      valueToTest === "landarea" ||
      valueToTest === "smallest_landarea" ||
      valueToTest === "largest_landarea"
    );
  }
}
