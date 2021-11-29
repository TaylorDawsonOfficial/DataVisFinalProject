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
      .attr("y", d => { return this.yScale(Math.max(0, d.population)) })
      .attr("height", d => {
        let atZero = this.height - this.yScale(0) - this.margin.bottom;
        let normal = this.height - this.yScale(d.population) - this.margin.bottom;
        return Math.abs(normal - atZero);
      })
      .attr("class", d => { return (d.population < 0 ? "bar bar-negative" : "bar bar-positive"); });

    this.svg.select(".zero-y-axis")
      .transition().duration(800)
      .selectAll("line")
      .attr("y1", this.yScale(0))
      .attr("y2", this.yScale(0))
      .attr("x1", this.margin.left)
      .attr("x2", this.width - this.margin.right);
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
      .attr("y", d => { return this.yScale(Math.max(0, d.population)) })
      .attr("height", d => {
        let atZero = this.height - this.yScale(0) - this.margin.bottom;
        let normal = this.height - this.yScale(d.population) - this.margin.bottom;
        return Math.abs(normal - atZero);
      })
      .attr("class", d => { return (d.population < 0 ? "bar bar-negative" : "bar bar-positive"); });

    this.svg.select(".zero-y-axis")
      .transition().duration(800)
      .selectAll("line")
      .attr("y1", this.yScale(0))
      .attr("y2", this.yScale(0))
      .attr("x1", this.margin.left)
      .attr("x2", this.width - this.margin.right);
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

    let minVal = d3.min(this.data, d => { return d.population });
    if (minVal > 0) {
      minVal = 0;
    }

    this.yScale = d3.scaleLinear()
      .domain(
        [minVal, d3.max(this.data, d => { return d.population })])
      .range([this.height - this.margin.bottom, this.margin.top]);

    this.xAxis = d3.axisBottom(this.xScale);
    this.yAxis = d3.axisLeft(this.yScale);


    this.svg.append("g")
      .attr("class", "zero-y-axis")
      .append("line")
      .attr("y1", this.yScale(0))
      .attr("y2", this.yScale(0))
      .attr("x1", this.margin.left)
      .attr("x2", this.width - this.margin.right);

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
      .on('mouseover', (e, d, i) => {
        console.log(d);
      })
      .attr("x", d => { return this.xScale(d.state) })
      .attr("y", d => { return this.yScale(Math.max(0, d.population)) })
      .attr("width", this.xScale.bandwidth())
      .attr("height", d => {
        let atZero = this.height - this.yScale(0) - this.margin.bottom;
        let normal = this.height - this.yScale(d.population) - this.margin.bottom;
        return Math.abs(normal - atZero);
      })
      .attr("class", d => { return (d.population < 0 ? "bar bar-negative" : "bar bar-positive"); });
  }

  assignPopData(newData) {
    // inspiration from here: https://bl.ocks.org/martinjc/f2241a09bd18caad10fc7249ca5d7816

    this.data = newData;

    let minVal = d3.min(this.data, d => { return d.population });
    if (minVal > 0) {
      minVal = 0;
    }

    let t = d3.transition().duration(800);
    this.yScale.domain([minVal, d3.max(newData, d => { return d.population })]);
    this.svg.selectAll(".bar")
      .data(newData)
      .join(
        enter => { },
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