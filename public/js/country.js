class Country {
  constructor(topologyData, initialYearData, selectedDataType) {
    this.width = 960;
    this.height = 600;
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
      const percent = ((this.currentData[key].population / this.currentData["total_population"]) * 100).toFixed(2);
      return `${name} Population: ${percent}% | ${this.currentData[key].population.toLocaleString("en-US")}`;
    }
    else if (this.selectedData === "square-mile") {
      return `${name} Population Per</br>Square Mile: ${this.currentData[key].landarea.toFixed(2).toLocaleString("en-US")}`;
    }
    else if (this.selectedData === "pop-increase") {
      return `${name} Population Change</br>Since 1969: ${this.currentData[key].percent_increase}%`;
    }
  }

  getLegendTitle() {
    if (this.selectedData === "total-pop") {
      return "Percentage of Total Population";
    }
    else if (this.selectedData === "square-mile") {
      return "Number of People Per Square Mile";
    }
    else if (this.selectedData === "pop-increase") {
      return "Percentage of Population Change";
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
        console.log(populationData);
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

    this.countrySVG.append("text")
      .attr("id", "legendTitle")
      .attr("x", this.width / 2)
      .attr("y", this.height - 10)
      .attr("text-anchor", "middle")
      .text(this.getLegendTitle())
  }

  /**
   * Creates Legend element and appends to Country SVG
   * @param {} populationData
   */
  createLegend(populationData) {
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
        legendScale.push(diff * i + +this.minAxisValue);
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

    let legend = this.countrySVG
      .selectAll(".legend")
      .data(mapColors)
      .enter()
      .append("g")
      .attr(
        "transform",
        `translate(${this.width - this.legendWidth - 75}, ${this.height - (this.legendHeight * 3)})`
      );

    legend
      .append("rect")
      .attr("width", this.legendWidth / this.sequentialColors.length)
      .attr("height", this.legendHeight)
      .style("fill", (d) => d)
      .attr("x", (d, i) => (this.legendWidth / this.sequentialColors.length) * i);

    this.countrySVG
      .append("g")
      .attr("class", "axis axis__legend")
      .attr(
        "transform",
        `translate(${this.width - this.legendWidth - 75}, ${this.height - this.legendHeight * 2})`
      )
      .call(legendAxis);

    d3.select("#legendTitle")
      .text(this.getLegendTitle())
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
