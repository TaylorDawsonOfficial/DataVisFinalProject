const width = 900;
const height = 600;
const svg = d3.select("body").append("svg")
  //.attr("width", width)
  //.attr("height", height)
  .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("preserveAspectRatio", "xMidYMid meet")
//.style("max-width", `${width}px`)

const projection = d3.geoAlbersUsa()
const path = d3.geoPath().projection(projection);

fetch('/data/topology').then(x => x.json()).then(x => {
  svg.selectAll('path')
    .data(x.features)
    .enter()
    .append('path')
    .attr("d", path)
    .attr('class', 'state')
    .on('mouseover', (d, i) => {
      document.getElementById("hovering-over").innerText = i.properties.name;
    })
});