class Country {
  constructor() {
    this.width = 960;
    this.height = 500;
    this.selectedColor = "lightpink"
    this.selectedState;
    this.data;

    $.ajax({
      method: "get",
      url: "/data/topology",
      success: data => {
        this.data = data[0];
        let states = topojson.feature(this.data, this.data.objects.states).features;
        this.setupSvg(states);
      }
    });
  }

  fillState(id, color = "") {
    $(`#${id}`).css('fill', color);
  }

  setupSvg(paths) {
    const svg = d3.select(".country-container")
      .append("svg")
      .attr("x", 0)
      .attr("y", 0)
      .attr("viewBox", `0 0 ${this.width} ${this.height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const projection = d3.geoAlbersUsa();
    const path = d3.geoPath().projection(projection);

    svg.selectAll(".state")
      .data(paths)
      .enter()
      .append("path")
      .attr("class", "state")
      .attr("d", path)
      .attr("id", (d) => { return d.id })
      .on("click", (d, i) => {
        let newState = i.properties.name;
        if (this.selectedState && this.selectedState !== newState) {
          this.fillState(this.selectedState);
        }
        this.selectedState = i.id;
        Map.selectedStateChanged(i);
        this.fillState(this.selectedState, this.selectedColor);
      });
  }
}



/*
    Sets up values on HTML page after page has loaded
  */
document.addEventListener(
  "DOMContentLoaded",
  function () {
    sliderYear();
  },
  false
);

/*
  Updates the text for the slider whenever the slider moves
*/
function sliderYear() {
  var slider = document.querySelector(".slider");
  var output = document.querySelector(".yearOutput");
  output.innerHTML = slider.value;

  slider.oninput = function () {
    output.innerHTML = this.value;
  };
}
