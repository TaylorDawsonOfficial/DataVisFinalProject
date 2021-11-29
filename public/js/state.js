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
    this.legendWidth = 800;
    this.legendHeight = 25;

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
      .attr("preserveAspectRatio", "xMidYMid meet")

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

    let legend = this.legendSVG
      .selectAll(".legend")
      .data(this.mapColors)
      .enter()
      .append("g")
      .attr(
        "transform",
        `translate(75,0)`
      );

    legend
      .append("rect")
      .attr("width", this.legendWidth / this.mapColors.length)
      .attr("height", this.legendHeight)
      .style("fill", (d) => d)
      .attr("x", (d, i) => (this.legendWidth / this.mapColors.length) * i);

    this.legendSVG
      .append("g")
      .attr("class", "axis axis__legend")
      .attr(
        "transform",
        `translate(75, ${this.legendHeight})`
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
    const lineChartSVGHeight = 300;
    const lineChartSVGWidth = 800;
    let margin = { top: 30, right: 75, bottom: 40, left: 75 };


    let svg = d3
      .select(".graph1")
      .append("svg")
      .attr("x", 0)
      .attr("y", 0)
      .attr("viewBox", `0 0 ${lineChartSVGWidth} ${lineChartSVGHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    //Title
    svg
      .append("text")
      .attr("class", "title")
      .attr("x", lineChartSVGWidth / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .text("Total State Population from 1969");

    let formattedStateData = [];
    Object.entries(stateData).forEach((d) => {
      formattedStateData.push({ year: d[0], population: d[1] });
    });


    //Create and add axes
    let xScale = d3
      .scaleLinear()
      .domain([1969, 2019])
      .range([margin.left, lineChartSVGWidth - margin.right]);

    let yScale = d3
      .scaleLinear()
      .domain([
        d3.min(formattedStateData, (d) => d.population),
        d3.max(formattedStateData, (d) => d.population),
      ])
      .range([lineChartSVGHeight - margin.bottom, margin.top]);

    let xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"))
    let yAxis = d3.axisLeft(yScale);

    let xAxisGroup = svg.append("g")
      .attr("transform", `translate(0, ${lineChartSVGHeight - margin.bottom})`)
      .call(xAxis);

    xAxisGroup.append("g")
      .attr("transform", `translate(${lineChartSVGWidth / 2}, 40)`)
      .append("text")
      .attr("class", "label")
      .attr("text-anchor", "middle")
      .text("Year")

    let yAxisGroup = svg.append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(yAxis)

    yAxisGroup.append("g")
      .attr("transform", `translate(-60, ${lineChartSVGHeight / 2})`)
      .append("text")
      .attr("class", "label")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .text("Population")


    // add line
    svg.append("path")
      .datum(formattedStateData)
      .attr("class", "line")
      .attr("d", d3.line()
        .x(d => { return xScale(d.year) })
        .y(d => { return yScale(d.population) }))
      .on('mousemove', (event, d) => {
        console.log(d);
      });

    //add circles for better visiblity
    // svg.append("g")
    //   .selectAll("dot")
    //   .data(formattedStateData)
    //   .enter()
    //   .append("circle")
    //   .attr("cx", d => { return xScale(d.year) })
    //   .attr("cy", d => { return yScale(d.population) })
    //   .attr("r", 2)
    //   .attr("class", "circle")
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
