class CountryBarChart {
  constructor(data) {
    this.margin = { top: 20, right: 20, bottom: 95, left: 95 };
    this.width = 860;
    this.height = 500;
    this.data = data;
    this.sortByString = "state";

    this.setupSvg();

    d3.select("#sort-by").on('change', () => {
      this.sortByString = $('#sort-by option:selected').val();
      this.sortBy();
    });
  }

  sortBy() {
    if (this.sortByString === "state") {
      this.sortByState();
    } else if (this.sortByString === "population") {
      this.sortByPopulation();
    }
  }

  sortByState() {
    let sortedData = [...this.data].sort((a, b) => {
      return d3.ascending(a.state, b.state);
    })
    this.xScale.domain(sortedData.map(d => { return d.state }))

    d3.select(".x-axis")
      .transition().duration(800)
      .call(this.xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.9em")
      .attr("dy", ".25em")
      .attr("transform", "rotate(-65)")

    this.svg.selectAll(".bar")
      .transition().duration(800)
      .attr("x", d => { return this.xScale(d.state) })
      .attr("y", d => { return this.yScale(d.population) })
      .attr("height", d => { return this.height - this.margin.bottom - this.yScale(d.population) });

  }

  sortByPopulation() {
    let sortedData = [...this.data].sort((a, b) => {
      return d3.descending(a.population, b.population);
    })

    this.xScale.domain(sortedData.map(d => { return d.state }))

    d3.select(".x-axis")
      .transition().duration(800)
      .call(this.xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.9em")
      .attr("dy", ".25em")
      .attr("transform", "rotate(-65)")

    this.svg.selectAll(".bar")
      .transition().duration(800)
      .attr("x", d => { return this.xScale(d.state) })
      .attr("y", d => { return this.yScale(d.population) })
      .attr("height", d => { return this.height - this.margin.bottom - this.yScale(d.population) });

  }

  setupSvg() {
    this.svg = d3
      .select(".visualization")
      .append("svg")
      .attr("x", 0)
      .attr("y", 0)
      .attr("id", "svg-bar")
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
      .on('mouseover', (e, d, i) => {
        console.log(d);
      })
      .attr("x", d => { return this.xScale(d.state) })
      .attr("y", d => { return this.yScale(d.population) })
      .attr("width", this.xScale.bandwidth())
      .attr("height", d => { return this.height - this.margin.bottom - this.yScale(d.population) })
  }

  assignPopData(newData) {
    this.data = newData;

    // inspiration from here: https://bl.ocks.org/martinjc/f2241a09bd18caad10fc7249ca5d7816
    let t = d3.transition().duration(800);

    this.yScale.domain([0, d3.max(newData, d => { return d.population })]);

    this.svg.selectAll(".bar")
      .data(newData)
      .join(
        enter => {
          return enter.append("rect")
            .attr("class", "bar")
            .attr("x", d => { return this.xScale(d.state) })
            .attr("width", this.xScale.bandwidth())
            .attr("y", this.height)
            .attr("height", 0);
        },
        update => {
          this.sortBy();
          this.yAxisGroup
            .transition(t)
            .call(this.yAxis);
        },
        exit => {
          return exit.remove();
        }
      )
  }
}