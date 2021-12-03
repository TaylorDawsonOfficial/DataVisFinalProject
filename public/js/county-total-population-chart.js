class CountyTotal {
  constructor(countyPopulationData) {
    this.countyPopulationData = countyPopulationData;
    this.currentPopulationData;
    this.currentCountyName;
    this.margin = { top: 40, right: 40, bottom: 40, left: 85 };
    this.width = 900;
    this.height = 300;
    this.svgAdded = false;
    this.bisectDate = d3.bisector((d) => d.year).left;
    this.renderEmpty();
  }

  renderEmpty() {
    d3.select(".graph3").append("h2").text("Select a county on the map...");
  }

  getArea() {
    return d3
      .area()
      .x((d) => {
        return this.xScale(d.year);
      })
      .y0(this.yScale.range()[0])
      .y1((d) => {
        return this.yScale(d.population);
      });
  }

  setupSvg() {
    // remove existing message in box
    d3.select(".graph3").select("h2").remove();

    //Add chart SVG
    this.svg = d3
      .select(".graph3")
      .append("svg")
      .attr("id", "totalCountyPopulation")
      .attr("x", 0)
      .attr("y", 0)
      .attr("viewBox", `0 0 ${this.width} ${this.height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    //Add chart title
    this.svg
      .append("text")
      .attr("class", "title")
      .attr("x", this.width / 2)
      .attr("y", this.margin.top / 2)
      .attr("text-anchor", "middle")
      .text(`${this.currentCountyName} population from 2010-2019`);

    //Create and add axes
    this.xScale = d3
      .scaleLinear()
      .domain(d3.extent(this.currentPopulationData, (d) => d.year))
      .range([this.margin.left, this.width - this.margin.right]);

    this.yScale = d3
      .scaleLinear()
      .domain([
        d3.min(this.currentPopulationData, (d) => d.population),
        d3.max(this.currentPopulationData, (d) => d.population),
      ])
      .range([this.height - this.margin.bottom, this.margin.top]);

    this.xAxis = d3.axisBottom(this.xScale).tickFormat(d3.format("d"));
    this.yAxis = d3.axisLeft(this.yScale).tickFormat(d3.format(".3s"));

    this.xAxisGroup = this.svg
      .append("g")
      .attr("transform", `translate(0, ${this.height - this.margin.bottom})`)
      .call(this.xAxis);

    this.xAxisGroup
      .append("g")
      .attr("transform", `translate(${this.width / 2}, 40)`)
      .append("text")
      .attr("class", "label")
      .attr("text-anchor", "middle")
      .text("Year");

    this.yAxisGroup = this.svg
      .append("g")
      .attr("transform", `translate(${this.margin.left}, 0)`)
      .call(this.yAxis);

    this.yAxisGroup
      .append("g")
      .attr("transform", `translate(-60, ${this.height / 2})`)
      .append("text")
      .attr("class", "label")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .text("Population");

    this.svg
      .append("path")
      .attr("id", "countyPath")
      .datum(this.currentPopulationData)
      .attr("class", "area")
      .attr("d", this.getArea())
      .on("mousemove", (event, d) => {
        // the hover event is inspired on what I (Carson) did on assignment 6 for the area chart.
        // I used some of the code I used on that assignment to add a similar hover event.
        const xValue = this.xScale.invert(d3.pointer(event)[0]);
        let i = this.bisectDate(this.currentPopulationData, xValue);
        let closestNode;
        if (i === 0) {
          closestNode = this.currentPopulationData[i];
        } else if (i === this.currentPopulationData.length) {
          closestNode = this.currentPopulationData[i - 1];
        } else {
          let leftNode = this.currentPopulationData[i - 1];
          let rightNode = this.currentPopulationData[i];
          closestNode =
            xValue - leftNode.year > rightNode.year - xValue
              ? rightNode
              : leftNode;
        }

        hoverGroup.style("opacity", 1);

        horizontalLine
          .attr("x1", this.margin.left)
          .attr("x2", this.width - this.margin.right)
          .attr("y1", this.yScale(closestNode.population))
          .attr("y2", this.yScale(closestNode.population));

        verticalLine
          .attr("x1", this.xScale(closestNode.year))
          .attr("x2", this.xScale(closestNode.year))
          .attr("y1", this.margin.top)
          .attr("y2", this.height - this.margin.bottom);

        circle
          .attr("cx", this.xScale(closestNode.year))
          .attr("cy", this.yScale(closestNode.population));
      })
      .on("mouseout", (event, d) => {
        hoverGroup.style("opacity", 0);
      });

    const hoverGroup = this.svg.append("g").style("opacity", 0);

    const horizontalLine = hoverGroup
      .append("line")
      .attr("class", "dashed-line");

    const verticalLine = hoverGroup.append("line").attr("class", "dashed-line");

    const circle = hoverGroup
      .append("circle")
      .attr("r", 4)
      .attr("class", "circle");
  }

  drawChart(countyId) {
    this.currentPopulationData = [];

    Object.entries(this.countyPopulationData).forEach((d) => {
      const year = d[0];
      this.currentCountyName = d[1][countyId].name;

      this.currentPopulationData.push({
        year: +year,
        population: +d[1][countyId].population,
      });
    });

    if (!this.svgAdded) {
      this.setupSvg();
      this.svgAdded = true;
    } else {
      this.yScale.domain([
        d3.min(this.currentPopulationData, (d) => d.population),
        d3.max(this.currentPopulationData, (d) => d.population),
      ]);
      this.yAxisGroup.transition().duration(500).call(this.yAxis);

      this.svg
        .select("#countyPath")
        .datum(this.currentPopulationData)
        .transition()
        .duration(500)
        .attr("d", this.getArea());

      this.svg
        .select(".title")
        .text(`${this.currentCountyName} population from 2010-2019`);
    }
  }
}
