import * as d3 from "d3";

var radviz = function () {
  var config = {
    el: null,
    size: 400,
    margin: 50,
    colorScale: d3.scaleOrdinal().range(["skyblue", "orange", "lime"]),
    colorAccessor: d => d,
    dimensions: [],
    drawLinks: true,
    zoomFactor: 1,
    dotRadius: 6,
    useRepulsion: false,
    useTooltip: true,
    tooltipFormatter: d => d
  };

  var events = d3.dispatch("panelEnter", "panelLeave", "dotEnter", "dotLeave");

  var render = function (data) {
    data = addNormalizedValues(data);
    var normalizeSuffix = "_normalized";
    var dimensionNamesNormalized = config.dimensions.map(d => d + normalizeSuffix);
    var thetaScale = d3.scaleLinear()
      .domain([0, dimensionNamesNormalized.length])
      .range([0, Math.PI * 2]);

    var chartRadius = config.size / 2 - config.margin;
    var nodeCount = data.length;
    var panelSize = config.size - config.margin * 2;

    var dimensionNodes = config.dimensions.map((d, i) => {
      var angle = thetaScale(i);
      return {
        index: nodeCount + i,
        x: chartRadius + Math.cos(angle) * chartRadius * config.zoomFactor,
        y: chartRadius + Math.sin(angle) * chartRadius * config.zoomFactor,
        fixed: true,
        name: d
      };
    });

    var linksData = [];
    data.forEach((d, i) => {
      dimensionNamesNormalized.forEach((dB, iB) => {
        linksData.push({
          source: i,
          target: nodeCount + iB,
          value: d[dB]
        });
      });
    });

    // ✅ D3 v7 force simulation
    var simulation = d3.forceSimulation([...data, ...dimensionNodes])
      .force("link", d3.forceLink(linksData)
        .strength(d => d.value)
        .id((d, i) => i))
      .force("charge", d3.forceManyBody().strength(-60))
      .force("center", d3.forceCenter(panelSize / 2, panelSize / 2))
      .velocityDecay(0.5);

    var svg = d3.select(config.el).append("svg")
      .attr("width", config.size)
      .attr("height", config.size);

    var root = svg.append("g")
      .attr("transform", `translate(${config.margin},${config.margin})`);

    var panel = root.append("circle")
      .classed("panel", true)
      .attr("r", chartRadius)
      .attr("cx", chartRadius)
      .attr("cy", chartRadius);

    var links = config.drawLinks
      ? root.selectAll(".link")
        .data(linksData)
        .enter().append("line")
        .classed("link", true)
      : null;

    var nodes = root.selectAll("circle.dot")
      .data(data)
      .enter().append("circle")
      .classed("dot", true)
      .attr("r", config.dotRadius)
      .attr("fill", d => config.colorScale(config.colorAccessor(d)))
      .on("mouseenter", function (event, d) {
        if (config.useTooltip) {
          const [x, y] = d3.pointer(event, config.el);
          tooltip.setText(config.tooltipFormatter(d))
            .setPosition(x, y)
            .show();
        }
        events.call("dotEnter", this, d);
        d3.select(this).classed("active", true);
      })
      .on("mouseout", function (event, d) {
        if (config.useTooltip) tooltip.hide();
        events.call("dotLeave", this, d);
        d3.select(this).classed("active", false);
      });

    simulation.on("tick", () => {
      if (config.drawLinks) {
        links
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);
      }
      nodes
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    });

    // ✅ Tooltip container
    var tooltipContainer = d3.select(config.el).append("div")
      .attr("id", "radviz-tooltip")
      .style("position", "absolute")
      .style("pointer-events", "none");

    var tooltip = tooltipComponent(tooltipContainer.node());
    return this;
  };

  var setConfig = function (_config) {
    config = { ...config, ..._config };
    return this;
  };

  var addNormalizedValues = function (data) {
    data.forEach(d => {
      config.dimensions.forEach(dimension => {
        d[dimension] = +d[dimension];
      });
    });

    var normalizationScales = {};
    config.dimensions.forEach(dimension => {
      normalizationScales[dimension] = d3.scaleLinear()
        .domain(d3.extent(data, d => d[dimension]))
        .range([0, 1]);
    });

    data.forEach(d => {
      config.dimensions.forEach(dimension => {
        d[dimension + "_normalized"] = normalizationScales[dimension](d[dimension]);
      });
    });

    return data;
  };

  var exports = {
    config: setConfig,
    render: render,
    on: (eventName, cb) => {
      events.on(eventName, cb);
      return exports;
    }
  };

  return exports;
};

var tooltipComponent = function (tooltipNode) {
  var root = d3.select(tooltipNode);

  return {
    setText: function (html) { root.html(html); return this; },
    setPosition: function (x, y) {
      root.style("left", x + "px").style("top", y + "px");
      return this;
    },
    show: function () { root.style("display", "block"); return this; },
    hide: function () { root.style("display", "none"); return this; }
  };
};

export default radviz;
