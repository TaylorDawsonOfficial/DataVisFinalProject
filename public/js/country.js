class Country {
  constructor(topologyData, initialYearData) {
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
    this.countrySVG;
    this.legendWidth = 350;
    this.legendHeight = 20;

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

  setupSvg(paths, populationData) {
    this.countrySVG = d3
      .select(".visualization")
      .append("svg")
      .attr("x", 0)
      .attr("y", 0)
      .attr("id", "svg-map");

    this.countrySVG
      .attr("viewBox", `0 0 ${this.width} ${this.height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const projection = d3.geoAlbersUsa();
    const path = d3.geoPath().projection(projection);

    this.countrySVG
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
        window.location.href = `state/${newState.replace(" ", "-")}`;
      });

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
    this.minPopPercent = +(
      (populationData["smallest_population"] /
        populationData["total_population"]) *
      100
    ).toFixed(2);
    this.maxPopPercent = +(
      (populationData["largest_population"] /
        populationData["total_population"]) *
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

    let legend = this.countrySVG
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

    this.countrySVG
      .append("g")
      .attr("class", "axis axis__legend")
      .attr(
        "transform",
        `translate(${this.width - this.legendWidth - 15},${this.height - 120})`
      )
      .call(legendAxis);
  }

  // /**
  //  * Creates Legend element and appends to Country SVG
  //  * @param {} populationData
  //  */
  // createLegend(populationData) {
  //   this.mapColorFill = d3.scaleQuantile().range(this.mapColors);

  //   this.updateLegendValues(populationData);

  //   //Legend data
  //   this.mapColorFill.domain([this.minPopPercent, this.maxPopPercent]);

  //   let fillRange = [];
  //   for (let i = 0; i <= this.mapColors.length; i++) {
  //     fillRange.push((this.legendWidth / this.mapColors.length) * i);
  //   }

  //   let legendAxisScale = d3.scaleQuantile().range(fillRange);

  //   let diff =
  //     (this.maxPopPercent - this.minPopPercent) / this.mapColors.length;
  //   let legendScale = [];
  //   legendScale.push(this.minPopPercent);
  //   for (let i = 0; i < this.mapColors.length - 1; i++) {
  //     legendScale.push(diff * (i + 1) + +this.minPopPercent);
  //   }

  //   legendScale.push(this.maxPopPercent);

  //   console.log(legendScale);

  //   legendAxisScale.domain(legendScale);

  //   let legendAxis = d3
  //     .axisBottom(legendAxisScale)
  //     .tickFormat((x) => x.toFixed(2) + "%");
  //   let legend = this.countrySVG
  //     .selectAll(".legend")
  //     .data(this.mapColors)
  //     .enter()
  //     .append("g")
  //     .attr(
  //       "transform",
  //       `translate(${this.width - this.legendWidth - 15},${this.height - 140})`
  //     );

  //   legend
  //     .append("rect")
  //     .attr("width", this.legendWidth / this.mapColors.length)
  //     .attr("height", this.legendHeight)
  //     .style("fill", (d) => d)
  //     .attr("x", (d, i) => (this.legendWidth / this.mapColors.length) * i);

  //   this.countrySVG
  //     .append("g")
  //     .attr("class", "axis")
  //     .attr(
  //       "transform",
  //       `translate(${this.width - this.legendWidth - 15},${this.height - 120})`
  //     )
  //     .call(legendAxis);
  // }

  // /**
  //  * Loops through new data set to compute
  //  * @param {*} populationData
  //  */
  // updateLegendValues(populationData) {
  //   // console.log(populationData);
  //   this.minPopPercent = +(
  //     (populationData["smallest_population"] /
  //       populationData["total_population"]) *
  //     100
  //   ).toFixed(2);
  //   this.maxPopPercent = +(
  //     (populationData["largest_population"] /
  //       populationData["total_population"]) *
  //     100
  //   ).toFixed(2);
  // }

  /*
    Updates the current population data based on the selected year in the slider
  */
  assignPopData(currentYearData) {
    const countryObject = this;

    //Loop through all states and update display based on population data
    Object.entries(currentYearData).forEach(function (data) {
      if (data[0] !== "total_population") {
        const pop_percentage =
          (data[1] / currentYearData["total_population"]) * 100;

        d3.select(`.${data[0]}`).attr("fill", () =>
          countryObject.fillState(data[0], pop_percentage)
        );
      }
    });
  }
}
