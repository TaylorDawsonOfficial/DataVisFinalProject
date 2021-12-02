class CountyScatterPlot {
  constructor(countyData, dataIsNotFilteredValue) {
    this.countyData = countyData;
    this.scatterplotCountyData;
    this.dataIsNotFilteredValue = dataIsNotFilteredValue;
    this.margin = { top: 40, right: 40, bottom: 45, left: 85 };
    this.width = 900;
    this.height = 300;
    this.formatData();
    this.setupSvg();
  }

  formatData() {
    this.scatterplotCountyData = [];
    Object.entries(this.countyData).forEach(d => {
      if (!this.dataIsNotFilteredValue(d[0])) {
        this.scatterplotCountyData.push({
          countyID: d[0],
          countyName: d[1].name,
          population: d[1].population,
          mileage: d[1].mileage,
        });
      }
    })
  }

  setupSvg() {
    //Add chart SVG
    this.svg = d3.select(".graph2")
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
      .text(`Relation of Population and County Size in ${this.countyData["year"]}`);

    //Create and add axes
    this.xScale = d3
      .scaleLinear()
      .domain([
        d3.min(this.scatterplotCountyData, (d) => d.mileage),
        d3.max(this.scatterplotCountyData, (d) => d.mileage)
      ])
      .range([this.margin.left, this.width - this.margin.right])

    this.yScale = d3
      .scaleLinear()
      .domain([
        d3.min(this.scatterplotCountyData, (d) => d.population),
        d3.max(this.scatterplotCountyData, (d) => d.population),
      ])
      .range([this.height - this.margin.bottom, this.margin.top]);

    this.xAxis = d3.axisBottom(this.xScale);
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
      .text("Square Miles of County");

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

    this.drawCircles();
  }

  drawCircles() {
    this.svg.selectAll("circle")
      .data(this.scatterplotCountyData)
      .join(
        (enter) => {
          let circles = enter.append("g")
          circles.append("circle")
            .attr("r", 5)
            .attr("cx", d => this.xScale(d.mileage))
            .attr("cy", d => this.yScale(d.population))
            .attr("fill", "black")
        },
        (update) => {
          console.log('in update');
          update.transition().duration(500)
            .attr("cx", d => this.xScale(d.mileage))
            .attr("cy", d => this.yScale(d.population))
          this.xAxisGroup.transition().duration(500).call(this.xAxis);
          this.yAxisGroup.transition().duration(500).call(this.yAxis);
          this.svg.select(".title")
            .text(`Relation of Population and County Size in ${this.countyData["year"]}`);
        },
        (exit) => {
          exit.remove();
        }
      )
  }

  updateCircles(newData) {
    console.log(this.scatterplotCountyData);
    this.countyData = newData;
    this.formatData();
    console.log(this.scatterplotCountyData);

    this.yScale.domain([
      d3.min(this.scatterplotCountyData, (d) => d.population),
      d3.max(this.scatterplotCountyData, (d) => d.population),
    ]);

    this.xScale.domain([
      d3.min(this.scatterplotCountyData, (d) => d.mileage),
      d3.max(this.scatterplotCountyData, (d) => d.mileage)
    ]);
    this.drawCircles();
  }
}

/*
  createScatterPlot(countyData) {
    //Get data needed for scatter plot
    let scatterplotCountyData = [];
    Object.entries(countyData).forEach((d) => {
      if (!this.dataIsNotFilteredValue(d[0])) {
        scatterplotCountyData.push({
          countyID: d[0],
          countyName: d[1].name,
          population: d[1].population,
          mileage: d[1].mileage,
        });
      }
    });

    d3.select(".scatterplot_svg").remove();

    const scatterplotSVGHeight = 250;
    const scatterplotSVGWidth = 500;
    const scatterplotSVGMargin = 70;

    const scatterplotHeight = scatterplotSVGHeight - 2 * scatterplotSVGMargin;
    const scatterplotWidth = scatterplotSVGWidth - 2 * scatterplotSVGMargin;

    //Add chart SVG
    d3.select(".graph2")
      .append("svg")
      .attr("width", scatterplotSVGWidth)
      .attr("height", scatterplotSVGHeight)
      .attr("class", "scatterplot_svg")
      .append("g")
      .attr(
        "transform",
        `translate(${scatterplotSVGMargin}, ${scatterplotSVGMargin})`
      );

    let svg = d3.select(".scatterplot_svg");

    //Add chart title
    svg
      .append("text")
      .attr("class", "title")
      .attr("x", scatterplotWidth / 2 + scatterplotSVGMargin)
      .attr("y", scatterplotSVGMargin / 2)
      .attr("text-anchor", "middle")
      .text(
        `County relation from population to square miles in ${countyData["year"]}`
      );

    //Set up color for scatterplot
    let color = d3.scaleOrdinal(d3.schemeCategory10);

    //Set up axes
    let xScale = d3.scaleLinear().range([0, scatterplotWidth]);
    let xValue = function (d) {
      return +d["mileage"];
    };
    let yScale = d3.scaleLinear().range([scatterplotHeight, 0]);
    let yValue = function (d) {
      return +d["population"];
    };

    let xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
    svg
      .append("text")
      .attr("class", "axis_label")
      .attr("x", scatterplotWidth / 2 + scatterplotSVGMargin)
      .attr("y", scatterplotHeight + scatterplotSVGMargin * 1.9)
      .attr("text-anchor", "middle")
      .text("Square Miles of County");

    let yAxis = d3.axisLeft(yScale);
    svg
      .append("text")
      .attr("class", "axis_label")
      .attr("x", -(scatterplotHeight / 2) - scatterplotSVGMargin * 1.3)
      .attr("y", scatterplotSVGMargin / 3)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text("Population of County");

    xScale.domain([
      d3.min(scatterplotCountyData, xValue),
      d3.max(scatterplotCountyData, xValue),
    ]);
    yScale.domain([
      d3.min(scatterplotCountyData, yValue),
      d3.max(scatterplotCountyData, yValue),
    ]);

    //Add axes
    svg
      .append("g")
      .attr("class", "axis_text")
      .attr(
        "transform",
        `translate(${scatterplotSVGMargin}, ${scatterplotHeight + scatterplotSVGMargin * 1.5
        })`
      )
      .call(xAxis)
      .append("text")
      .attr("x", scatterplotWidth)
      .attr("y", -6)
      .text("Mileage");
    svg
      .append("g")
      .attr("class", "axis_text")
      .attr(
        "transform",
        `translate(${scatterplotSVGMargin}, ${scatterplotSVGMargin + scatterplotSVGMargin / 2
        })`
      )
      .call(yAxis)
      .append("text")
      .text("Population");

    //Draw circles
    svg
      .selectAll("circle")
      .data(scatterplotCountyData)
      .enter()
      .append("circle")
      .attr("class", (d) => d["countyID"])
      .attr("r", 7)
      .attr("cx", (d) => xScale(+d["mileage"]))
      .attr("cy", (d) => yScale(+d["population"]))
      .attr(
        "transform",
        `translate(${scatterplotSVGMargin}, ${scatterplotSVGMargin + scatterplotSVGMargin / 2
        })`
      )
      .style("fill", (d) => color(d["countyID"]))
      .on("mousedown", (e) => {
        d3.select(e.target).attr("r", 12);
      })
      .on("mouseup", (e, d) => {
        d3.select(e.target).attr("r", 7);
      });

    //Create legend
    let legend = svg
      .selectAll(".legend")
      .data(color.domain())
      .enter()
      .append("g")
      .attr("class", "legend");
    legend.attr(
      "transform",
      (d, i) => `translate(${scatterplotWidth / 2}, ${20 * i})`
    );
  }
*/