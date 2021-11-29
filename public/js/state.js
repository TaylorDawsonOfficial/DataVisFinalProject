class State {
  constructor(stateName, topologyData, stateData, dataStartYear, countyData) {
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

    //Create SVG for state map display
    this.setupSvg(state, countyData, stateData[dataStartYear]);

    //Assign population data to state map
    this.assignPopData(countyData, stateData[dataStartYear]);

    //Create line chart for state's population from 1969
    this.createLineChart(stateData);

    //Chart 2
    this.createBarChart(countyData);

    //Chart 3
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
        const pop_percentage = (data[1].population / state_population) * 100;

        const countySelector = `county__${data[0]}`;

        d3.select(`.${countySelector}`).attr("fill", () =>
          stateObject.fillCounty(countySelector, pop_percentage)
        );
      }
    });
  }

  formatPopulationOnAxis(value) {
    return d3.format("~s")(value);
  }

  createLineChart(stateData) {
    const lineChartSVGHeight = 250;
    const lineChartSVGWidth = 500;
    const lineChartSVGMargin = 40;

    const lineChartHeight = lineChartSVGHeight - 2 * lineChartSVGMargin;
    const lineChartWidth = lineChartSVGWidth - 2 * lineChartSVGMargin;

    d3.select(".graph1")
      .append("svg")
      .attr("width", lineChartSVGWidth)
      .attr("height", lineChartSVGHeight)
      .attr("class", "line_chart_svg")
      .append("g")
      .attr(
        "transform",
        `translate(${lineChartSVGMargin}, ${lineChartSVGMargin})`
      );

    let svg = d3.select(".line_chart_svg");

    //Title
    svg
      .append("text")
      .attr("class", "title")
      .attr("x", lineChartWidth / 2 + lineChartSVGMargin)
      .attr("y", lineChartSVGMargin / 2)
      .attr("text-anchor", "middle")
      .text("Total State Population from 1969");

    let formattedStateData = [];
    Object.entries(stateData).forEach((d) => {
      formattedStateData.push({ year: d[0], population: d[1] });
    });

    console.log(formattedStateData);

    // console.log(d3.min(stateData));

    //Create and add axes
    let xScale = d3
      .scaleLinear()
      .domain([1969, 2019])
      .range([0, lineChartWidth]);

    svg
      .append("g")
      .attr("class", "axis x_axis")
      .attr(
        "transform",
        `translate(${lineChartSVGMargin}, ${
          lineChartSVGMargin + lineChartHeight
        })`
      )
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

    let yScale = d3
      .scaleLinear()
      .domain([
        d3.min(formattedStateData, (d) => d.population),
        d3.max(formattedStateData, (d) => d.population),
      ])
      .range([lineChartHeight, 0]);

    svg
      .append("g")
      .attr("class", "axis y_axis")
      .attr(
        "transform",
        `translate(${lineChartSVGMargin}, ${lineChartSVGMargin})`
      )
      .call(
        d3.axisLeft(yScale).tickFormat((d) => this.formatPopulationOnAxis(d))
      );

    //Axis labels

    //Function to draw line
    const lineFunction = d3
      .line()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.population));

    //Add line
    svg
      .append("path")
      .data([formattedStateData])
      .attr("class", "line")
      .attr("d", lineFunction)
      .attr(
        "transform",
        `translate(${lineChartSVGMargin}, ${lineChartSVGMargin})`
      );
  }

  createBarChart(data) {
    console.log("SP", data);

    const barChartSVGHeight = 250;
    const barChartSVGWidth = 500;
    const barChartSVGMargin = 40;

    const barChartHeight = barChartSVGHeight - 2 * barChartSVGMargin;
    const barChartWidth = barChartSVGWidth - 2 * barChartSVGMargin;

    d3.select(".graph2")
      .append("svg")
      .attr("width", barChartSVGWidth)
      .attr("height", barChartSVGHeight)
      .attr("class", "bar_chart_svg")
      .append("g")
      .attr(
        "transform",
        `translate(${barChartSVGMargin}, ${barChartSVGMargin})`
      );

    let svg = d3.select(".bar_chart_svg");

    svg
      .append("text")
      .attr("class", "title")
      .attr("x", barChartSVGWidth / 2 + barChartSVGMargin)
      .attr("y", barChartSVGMargin / 2)
      .attr("text-anchor", "middle")
      .text("County Bar Chart");

    let barChartData = [];

    Object.entries(data).forEach((d) => {
      if (d[0] !== "highest_population" && d[0] !== "lowest_population") {
        if (d[1].name.substring(d[1].name.length - 6) === "County") {
          barChartData.push({
            name: d[1].name.substring(0, d[1].name.length - 7),
            population: d[1].population,
          });
        } else {
          barChartData.push({ name: d[1].name, population: d[1].population });
        }
      }
    });

    //Create and add axes
    let xScale = d3
      .scaleBand()
      .domain(barChartData.map((d) => d.name))
      .range([0, barChartWidth]);

    console.log(barChartData.map((d) => d.name));

    svg
      .append("g")
      .attr("class", "axis x_axis")
      .attr(
        "transform",
        `translate(${barChartSVGMargin}, ${barChartSVGMargin + barChartHeight})`
      )
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-65)");

    let yScale = d3
      .scaleLinear()
      .domain([
        d3.min(barChartData, (d) => d.population),
        d3.max(barChartData, (d) => d.population),
      ])
      .range([barChartHeight, 0]);

    svg
      .append("g")
      .attr("class", "axis y_axis")
      .attr(
        "transform",
        `translate(${barChartSVGMargin}, ${barChartSVGMargin})`
      )
      .call(
        d3.axisLeft(yScale).tickFormat((d) => this.formatPopulationOnAxis(d))
      );

    //Add bars to chart
    const bars = svg.selectAll().data(barChartData).enter();
    bars
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(d.name))
      .attr("y", (d) => yScale(d.population))
      .attr(
        "transform",
        `translate(${barChartSVGMargin}, ${barChartSVGMargin})`
      )
      .attr("height", (d) => barChartHeight - yScale(d.population))
      .attr("width", xScale.bandwidth());
  }
}
