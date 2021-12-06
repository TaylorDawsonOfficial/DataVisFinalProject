class StateTotal {
  constructor(stateName, stateData) {
    this.stateName = stateName;
    this.stateData = stateData;
    this.margin = { top: 40, right: 85, bottom: 40, left: 85 };
    this.width = 900;
    this.height = 300;
    this.formatData();
    this.drawSvg();
    this.bisectDate = d3.bisector(d => d.year).left;
  }

  formatData() {
    this.formattedStateData = [];
    Object.entries(this.stateData).forEach((d) => {
      this.formattedStateData.push(
        { year: d[0], population: d[1] }
      );
    });

  }

  drawSvg() {
    let tooltip = d3.select(".tooltip");

    let svg = d3
      .select(".graph1")
      .append("svg")
      .attr("id", "totalStatePopulation")
      .attr("x", 0)
      .attr("y", 0)
      .attr("viewBox", `0 0 ${this.width} ${this.height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    svg
      .append("text")
      .attr("class", "title")
      .attr("x", this.width / 2)
      .attr("y", this.margin.top / 2)
      .attr("text-anchor", "middle")
      .text(`${this.stateName} Total Population from 1969-2019`);

    //Create and add axes
    let xScale = d3
      .scaleLinear()
      .domain([1969, 2019])
      .range([this.margin.left, this.width - this.margin.right]);

    let yScale = d3
      .scaleLinear()
      .domain([
        d3.min(this.formattedStateData, (d) => d.population),
        d3.max(this.formattedStateData, (d) => d.population),
      ])
      .range([this.height - this.margin.bottom, this.margin.top]);

    let xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
    let yAxis = d3.axisLeft(yScale).tickFormat(d3.format("~s"));

    let xAxisGroup = svg
      .append("g")
      .attr("transform", `translate(0, ${this.height - this.margin.bottom})`)
      .call(xAxis);

    xAxisGroup
      .append("g")
      .attr("transform", `translate(${this.width / 2}, 40)`)
      .append("text")
      .attr("class", "label")
      .attr("text-anchor", "middle")
      .text("Year");

    let yAxisGroup = svg
      .append("g")
      .attr("transform", `translate(${this.margin.left}, 0)`)
      .call(yAxis);

    yAxisGroup
      .append("g")
      .attr("transform", `translate(-60, ${this.height / 2})`)
      .append("text")
      .attr("class", "label")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .text("Population");

    // add line
    svg
      .append("path")
      .datum(this.formattedStateData)
      .attr("class", "line")
      .attr("d", d3.line()
        .x((d) => { return xScale(d.year); })
        .y((d) => { return yScale(d.population); })
      )
      .on("mouseover", function (event, d) {
        d3.select(this).style("fill-opacity", 0.5);
      })

    // add circles for better visibility
    svg.append("g")
      .selectAll("circle")
      .data(this.formattedStateData)
      .enter()
      .append("circle")
      .attr("cx", d => { return xScale(d.year) })
      .attr("cy", d => { return yScale(d.population) })
      .attr("r", 3)
      .attr("class", "circle")
      .on("mouseover", function (event, d) {
        d3.select(this).style("fill-opacity", 0.5);
        tooltip
          .html(`Population in ${d.year}: ${d.population.toLocaleString("en-US")}`)
          .attr("class", "tooltip visible")
          .style("left", `${event.x}px`)
          .style("top", `${event.y}px`);
      })
      .on("mouseout", function (event, d) {
        d3.select(this).style("fill-opacity", 1);
        tooltip.attr("class", "tooltip invisible");
      })
  }
}