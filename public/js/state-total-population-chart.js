class StateTotal {
  constructor(stateData) {
    this.stateData = stateData;
    this.margin = { top: 40, right: 40, bottom: 40, left: 85 };
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
      .text("Total State Population from 1969-2019");

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
    let yAxis = d3.axisLeft(yScale).tickFormat(d3.format(".2s"));

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
      .attr("class", "area")
      .attr("d", d3.area()
        .x((d) => { return xScale(d.year); })
        .y0(yScale.range()[0])
        .y1((d) => { return yScale(d.population); })
      )
      .on("mousemove", (event, d) => {
        // the hover event is inspired on what I (Carson) did on assignment 6 for the area chart.
        // I used some of the code I used on that assignment to add a similar hover event.
        const xValue = xScale.invert(d3.pointer(event)[0]);
        let i = this.bisectDate(this.formattedStateData, xValue);
        let closestNode;
        if (i === 0) {
          closestNode = this.formattedStateData[i];
        }
        else if (i === this.formattedStateData.length) {
          closestNode = this.formattedStateData[i - 1];
        }
        else {
          let leftNode = this.formattedStateData[i - 1];
          let rightNode = this.formattedStateData[i];
          closestNode = xValue - leftNode.year > rightNode.year ? rightNode : leftNode;
        }

        hoverGroup.style("opacity", 1);

        horizontalLine
          .attr("x1", this.margin.left)
          .attr("x2", this.width - this.margin.right)
          .attr("y1", yScale(closestNode.population))
          .attr("y2", yScale(closestNode.population));

        verticalLine
          .attr("x1", xScale(closestNode.year))
          .attr("x2", xScale(closestNode.year))
          .attr("y1", this.margin.top)
          .attr("y2", this.height - this.margin.bottom)

        circle
          .attr("cx", xScale(closestNode.year))
          .attr("cy", yScale(closestNode.population))
      })
      .on('mouseout', (event, d) => {
        hoverGroup.style("opacity", 0);
      })

    const hoverGroup = svg.append("g").style("opacity", 0);

    const horizontalLine = hoverGroup.append("line")
      .attr("class", "dashed-line");

    const verticalLine = hoverGroup.append("line")
      .attr("class", "dashed-line")

    const circle = hoverGroup.append("circle")
      .attr("r", 4)
      .attr("class", "circle")
  }
}