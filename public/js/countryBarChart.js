class CountryBarChart {
  constructor(data) {
    this.margin = { top: 20, right: 20, bottom: 95, left: 95 };
    this.width = 860;
    this.height = 500;
    this.data = data;

    this.setupSvg();


    d3.select("#by-state").on("click", () => {
      this.data.sort((a, b) => {
        return d3.ascending(a.state, b.state);
      })
      this.xScale.domain(this.data.map(d => { return d.state }))

      d3.select(".x-axis")
        .transition().duration(1000)
        .call(this.xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.9em")
        .attr("dy", ".25em")
        .attr("transform", "rotate(-65)")

      this.svg.selectAll(".bar")
        .transition().duration(1000)
        .attr("x", d => { return this.xScale(d.state) });

    })

    d3.select("#by-population").on("click", () => {
      this.data.sort((a, b) => {
        return d3.descending(a.population, b.population);
      })

      this.xScale.domain(this.data.map(d => { return d.state }))

      d3.select(".x-axis")
        .transition().duration(1000)
        .call(this.xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.9em")
        .attr("dy", ".25em")
        .attr("transform", "rotate(-65)")

      this.svg.selectAll(".bar")
        .transition().duration(1000)
        .attr("x", d => { return this.xScale(d.state) });

    })
  }

  setupSvg() {
    this.svg = d3
      .select(".country-container")
      .append("svg")
      .attr("x", 0)
      .attr("y", 0)
      .attr("id", "svg-chart")
      .attr("viewBox", `0 0 ${this.width} ${this.height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("style", "display: none");

    this.xScale = d3.scaleBand()
      .domain(this.data.map(d => { return d.state }))
      .range([this.margin.left, this.width - this.margin.right])
      .padding(0.2);

    this.yScale = d3.scaleLinear()
      .domain(
        [0, d3.max(this.data, d => { return d.population })])
      .range([this.height - this.margin.bottom, this.margin.top]);

    this.xAxis = d3.axisBottom(this.xScale);
    this.yAxis = d3.axisLeft(this.yScale);

    this.xAxisGroup = this.svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${this.height - this.margin.bottom})`)
      .call(this.xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-65)");

    this.yAxisGroup = this.svg.append("g")
      .attr("transform", `translate(${this.margin.left}, 0)`)
      .call(this.yAxis)

    this.yAxisGroup.append("g")
      .attr("transform", `translate(-80, ${this.height / 2})`)
      .append("text")
      .attr("class", "label")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .text("Population")

    this.svg.append("g")
      .selectAll(".bar")
      .data(this.data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => { return this.xScale(d.state) })
      .attr("y", d => { return this.yScale(d.population) })
      .attr("width", this.xScale.bandwidth())
      .attr("height", d => { return this.height - this.margin.bottom - this.yScale(d.population) })
  }

  assignPopData(newData) {
    // inspiration from here: https://bl.ocks.org/martinjc/f2241a09bd18caad10fc7249ca5d7816
    let t = d3.transition().duration(1000);

    this.yScale.domain([0, d3.max(newData, d => { return d.population })])

    let bars = this.svg.selectAll(".bar")
      .data(newData);
    bars.exit().remove();

    let newBars = bars.enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => { return this.xScale(d.state) })
      .attr("y", d => { return this.yScale(d.population) })
      .attr("width", this.xScale.bandwidth())
      .attr("height", d => { return this.height - this.margin.bottom - this.yScale(d.population) })

    newBars.merge(bars)
      .transition(t)
      .attr("y", d => { return this.yScale(d.population) })
      .attr("height", d => { return this.height - this.margin.bottom - this.yScale(d.population) })

    this.yAxisGroup
      .transition(t)
      .call(this.yAxis);

    this.data = newData;
  }
}