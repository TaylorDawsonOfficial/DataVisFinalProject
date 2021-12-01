class State {
  constructor(stateName, topologyData, stateData, dataStartYear, countyData, startingData) {
    this.stateName = stateName;
    this.countyPopulationData = countyData;
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
    this.minAxisValue;
    this.maxAxisValue;
    this.stateSVG;
    this.legendWidth = 800;
    this.legendHeight = 25;
    this.selectedData = startingData;

    let key = Object.keys(topologyData.objects)[0];
    let state = topojson.feature(topologyData, topologyData.objects[key]);

    //Create SVG for state map display
    this.setupSvg(
      state,
      this.countyPopulationData[dataStartYear],
      stateData[dataStartYear]
    );

    //Assign population data to state map
    this.assignPopData(
      this.countyPopulationData[dataStartYear],
      stateData[dataStartYear]
    );

    //Create line chart for state's population from 1969
    this.createLineChart(stateData);

    //Chart 2
    // this.createBarChart(countyData);

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
      .attr("preserveAspectRatio", "xMidYMid meet");

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
        //Display area chart for selected county
        this.createAreaChart(d.properties.GEOID);
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
    let tickFormat;
    switch(this.selectedData){
      case "total-pop":
        this.minAxisValue = +(
          (countyPopData["lowest_population"] / totalStatePopulation) *
          100
        ).toFixed(2);
        this.maxAxisValue = +(
          (countyPopData["highest_population"] / totalStatePopulation) *
          100
        ).toFixed(2);
        tickFormat = (x) => x.toFixed(2) + "%";
        break;
      case "square-mile":
        console.log("Update legend", countyPopData, totalStatePopulation);
        this.minAxisValue =
          +countyPopData["smallest_landarea"].toFixed(2);
        this.maxAxisValue =
          +countyPopData["largest_landarea"].toFixed(2);

        tickFormat = (x) => x.toFixed(2);
        break;
      case "pop-increase":
        console.log(countyPopData, totalStatePopulation);
        this.minAxisValue =
          +countyPopData["lowest_percent_change"].toFixed(2);
        this.maxAxisValue =
          +countyPopData["highest_percent_change"].toFixed(2);

        tickFormat = (x) => x.toFixed(2) + "%";
        break;
    }   

    //Legend data
    this.mapColorFill.domain([this.minAxisValue, this.maxAxisValue]);

    let fillRange = [];
    for (let i = 0; i <= this.mapColors.length; i++) {
      fillRange.push((this.legendWidth / this.mapColors.length) * i);
    }

    let legendAxisScale = d3.scaleQuantile().range(fillRange);

    let diff;

    if(this.minAxisValue < 0)
      diff = (this.maxAxisValue + this.minAxisValue) / this.mapColors.length;
    else
      diff = (this.maxAxisValue - this.minAxisValue) / this.mapColors.length;
      
    let legendScale = [];
    legendScale.push(this.minAxisValue);
    for (let i = 0; i < this.mapColors.length - 1; i++) {
      if(this.minAxisValue < 0)
      legendScale.push(diff * (i + 1) - +this.minAxisValue);
      else
        legendScale.push(diff * (i + 1) + +this.minAxisValue);
    }

    legendScale.push(this.maxAxisValue);

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
      .attr("transform", `translate(75,0)`);

    legend
      .append("rect")
      .attr("width", this.legendWidth / this.mapColors.length)
      .attr("height", this.legendHeight)
      .style("fill", (d) => d)
      .attr("x", (d, i) => (this.legendWidth / this.mapColors.length) * i);

    this.legendSVG
      .append("g")
      .attr("class", "axis axis__legend")
      .attr("transform", `translate(75, ${this.legendHeight})`)
      .call(legendAxis);
  }

  /*
    Updates the current population data based on the selected year in the slider
  */
  assignPopData(county_data, state_population) {
    //Loop through all states and update display based on population data
    const stateObject = this;

    switch (this.selectedData) {
      case "total-pop":
        Object.entries(county_data).forEach(function (data) {
          if (!stateObject.dataIsNotFilteredValue(data[0])) {
            const pop_percentage = (data[1].population / state_population) * 100;
    
            const countySelector = `county__${data[0]}`;
    
            d3.select(`.${countySelector}`).attr("fill", () =>
              stateObject.fillCounty(countySelector, pop_percentage)
            );
          }
        });
        break;
      case "pop-increase":
        Object.entries(county_data).forEach(function (data) {
          if (!stateObject.dataIsNotFilteredValue(data[0])) {
            const countySelector = `county__${data[0]}`;
    
            d3.select(`.${countySelector}`).attr("fill", () =>
              stateObject.fillCounty(countySelector, +data[1].percentIncrease)
            );
          }
        });
        break;
      case "square-mile":
        console.log("Assign pop: ", county_data);
        Object.entries(county_data).forEach(function (data) {
          if (!stateObject.dataIsNotFilteredValue(data[0])) {
            const countySelector = `county__${data[0]}`;
            d3.select(`.${countySelector} `).attr("fill", () =>
              stateObject.fillCounty(countySelector, +data[1].mileage)
            );
          }
        });
        break;
    }

    
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

    let xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
    let yAxis = d3.axisLeft(yScale);

    let xAxisGroup = svg
      .append("g")
      .attr("transform", `translate(0, ${lineChartSVGHeight - margin.bottom})`)
      .call(xAxis);

    xAxisGroup
      .append("g")
      .attr("transform", `translate(${lineChartSVGWidth / 2}, 40)`)
      .append("text")
      .attr("class", "label")
      .attr("text-anchor", "middle")
      .text("Year");

    let yAxisGroup = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(yAxis);

    yAxisGroup
      .append("g")
      .attr("transform", `translate(-60, ${lineChartSVGHeight / 2})`)
      .append("text")
      .attr("class", "label")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .text("Population");

    // add line
    svg
      .append("path")
      .datum(formattedStateData)
      .attr("class", "line")
      .attr(
        "d",
        d3
          .line()
          .x((d) => {
            return xScale(d.year);
          })
          .y((d) => {
            return yScale(d.population);
          })
      )
      .on("mousemove", (event, d) => {
        console.log(d);
      });
  }

  createAreaChart(county_id) {
    console.log("SP", county_id, this.countyPopulationData);

    //Remove prior chart
    d3.select(".area_chart_svg").remove();
    let currentCountyData = [];
    let countyName;

    //Format data
    Object.entries(this.countyPopulationData).forEach((d) => {
      const year = d[0];
      countyName = d[1][county_id].name;

      currentCountyData.push({
        year: +year,
        population: +d[1][county_id].population,
      });
    });

    const areaChartSVGHeight = 250;
    const areaChartSVGWidth = 500;
    const areaChartSVGMargin = 70;

    const areaChartHeight = areaChartSVGHeight - 2 * areaChartSVGMargin;
    const areaChartWidth = areaChartSVGWidth - 2 * areaChartSVGMargin;

    //Add chart SVG
    d3.select(".graph3")
      .append("svg")
      .attr("width", areaChartSVGWidth)
      .attr("height", areaChartSVGHeight)
      .attr("class", "area_chart_svg")
      .append("g")
      .attr(
        "transform",
        `translate(${areaChartSVGMargin}, ${areaChartSVGMargin})`
      );

    let svg = d3.select(".area_chart_svg");

    //Add chart title
    svg
      .append("text")
      .attr("class", "title")
      .attr("x", areaChartWidth / 2 + areaChartSVGMargin)
      .attr("y", areaChartSVGMargin / 2)
      .attr("text-anchor", "middle")
      .text(`${countyName} population from 2010 to 2019`);

    //Create and add axes
    let xScale = d3
      .scaleLinear()
      .domain(d3.extent(currentCountyData, (d) => d.year))
      .range([0, areaChartWidth]);

    svg
      .append("g")
      .attr("class", "axis x_axis")
      .attr(
        "transform",
        `translate(${areaChartSVGMargin}, ${
          areaChartSVGMargin + areaChartHeight
        })`
      )
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));
    svg
      .append("text")
      .attr("class", "axis_label")
      .attr("x", areaChartWidth / 2 + areaChartSVGMargin)
      .attr("y", areaChartHeight + areaChartSVGMargin + 40)
      .attr("text-anchor", "middle")
      .text("Year");

    let yScale = d3
      .scaleLinear()
      .domain(d3.extent(currentCountyData, (d) => d.population))
      .range([areaChartHeight, 0]);

    svg
      .append("g")
      .attr("class", "axis y_axis")
      .attr(
        "transform",
        `translate(${areaChartSVGMargin}, ${areaChartSVGMargin})`
      )
      .call(
        d3.axisLeft(yScale).tickFormat((d) => this.formatPopulationOnAxis(d))
      );

    svg
      .append("text")
      .attr("class", "axis_label")
      .attr("x", -(areaChartHeight / 2) - areaChartSVGMargin * 1.5)
      .attr("y", areaChartSVGMargin / 2.5)
      .attr("transform", "rotate(-90)")
      .text("Population");

    //Add area chart
    svg
      .append("path")
      .datum(currentCountyData)
      .attr("class", "linearea")
      .attr(
        "transform",
        `translate(${areaChartSVGMargin}, ${areaChartSVGMargin})`
      )
      .attr(
        "d",
        d3
          .area()
          .x((d) => xScale(d.year))
          .y0(areaChartHeight)
          .y1((d) => yScale(d.population))
      );
  }

  setSelectedData(newSelection){
    this.selectedData = newSelection;
  }

  dataIsNotFilteredValue(valueToTest) {
    return (
      valueToTest === "largest_percent_increase" ||
      valueToTest === "largest_population" ||
      valueToTest === "smallest_percent_increase" ||
      valueToTest === "smallest_population" ||
      valueToTest === "total_population" ||
      valueToTest === "landarea" ||
      valueToTest === "smallest_landarea" ||
      valueToTest === "largest_landarea"
    );
  }
}
