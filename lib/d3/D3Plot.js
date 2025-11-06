import * as d3 from 'd3';

export const COLOR_LIST = Object.freeze(["#4f46e5", "#00A2FF", "#00C853", "#FFD600", "#AA00FF", "#D50000"]);

export const TOOLTIP_DEFAULTS = Object.freeze({
  xOffset: 10,
  yOffset: -28,
  inDuration: 100,
  outDuration: 200,
  text: null   // function(d) => string
});

const AXIS_ARGS_DEFAULTS = Object.freeze({
  show: true,
  ticks: 5,
  tickFormat: null,
  label: null
});

export class D3Plot {
  constructor({
    containerId,
    data,
    xField,
    yField,
    xLabel = null,
    yLabel = null,
    showXAxis = true,
    showYAxis = true,
    breakoutField = null,
    colorMap = null,
    width = 600,
    height = 400,
    xAxisArgs = {},
    yAxisArgs = {},
    tooltipArgs = {},
    isXQualitative = false,
  }) {
    this.containerId = containerId;
    this.data = data;
    this.xField = xField;
    this.yField = yField;
    this.xLabel = xLabel;
    this.yLabel = yLabel;
    this.showXAxis = showXAxis;
    this.showYAxis = showYAxis;
    this.breakoutField = breakoutField;
    this.colorMap = colorMap;
    this.width = width;
    this.height = height;
    this.isXQualitative = isXQualitative;
    this.container = null;
    this.filterContainer = null;

    this.xAxisArgs = { ...AXIS_ARGS_DEFAULTS, ...xAxisArgs };
    this.yAxisArgs = { ...AXIS_ARGS_DEFAULTS, ...yAxisArgs };
    this.tooltipConfig = { ...TOOLTIP_DEFAULTS, ...tooltipArgs };

    // state
    this.activeGroups = breakoutField
      ? [...new Set(data.map(d => d[breakoutField]))]
      : ["default"];

    // Initialize everything
    this.init();
  }

  init() {
    this.container = d3.select(`#${this.containerId}`)
      .classed("d3-plot-container", true);

    this._initColorMap();
    this._initFilters();
    this._initSvgAndGroups();
    this._initAxes();
    if (this.tooltipConfig.text) this._initTooltip();
  }

  _initColorMap() {
    if (this.colorMap) return; // keep provided map
    this.colorMap = {};
    let groups = this.breakoutField
      ? [...new Set(this.data.map(d => d[this.breakoutField]))]
      : ["default"];
    groups.forEach((val, i) => {
      this.colorMap[val] = COLOR_LIST[i % COLOR_LIST.length];
    });
  }

  _initSvgAndGroups() {
    this.svg = this.container.append("svg")
      .attr("class", "d3-plot")
      .attr("width", this.width)
      .attr("height", this.height);

    this.margin = { top: 40, right: 40, bottom: 60, left: 80 };
    this.innerWidth = this.width - this.margin.left - this.margin.right;
    this.innerHeight = this.height - this.margin.top - this.margin.bottom;

    this.g = this.svg.append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    // scales
    if (this.isXQualitative) {
      this.x = d3.scaleBand().range([0, this.innerWidth]).padding(0.2);
    } else {
      this.x = d3.scaleLinear().range([0, this.innerWidth]);
    }
    this.y = d3.scaleLinear().range([this.innerHeight, 0]);
  }

  _initAxes() {
    if (this.xAxisArgs.show) {
      this.xAxis = this.g.append("g")
        .attr("transform", `translate(0,${this.innerHeight})`);

      if (this.xAxisArgs.label) {
        this.g.append("text")
          .attr("class", "axis-label")
          .attr("x", this.innerWidth / 2)
          .attr("y", this.innerHeight + 45)
          .style("text-anchor", "middle")
          .text(this.xAxisArgs.label);
      }
    }

    if (this.yAxisArgs.show) {
      this.yAxis = this.g.append("g");

      if (this.yAxisArgs.label) {
        this.g.append("text")
          .attr("class", "axis-label")
          .attr("transform", "rotate(-90)")
          .attr("x", -this.innerHeight / 2)
          .attr("y", -55)
          .style("text-anchor", "middle")
          .text(this.yAxisArgs.label);
      }
    }
  }

  _initFilters() {
    // create container for all filters
    this.filterContainer = this.container.select(".filter-container");
    if (this.filterContainer.empty()) {
      this.filterContainer = this.container.append("div")
        .attr("class", "filter-container");
    }

    // init filters as needed
    if (this.breakoutField) this._initBreakoutFilters();
  }

  _initBreakoutFilters() {
    // Create (or reuse) a filters div inside the container
    let filterDiv = this.filterContainer.select(".breakout-filters");
    if (filterDiv.empty()) {
      filterDiv = this.filterContainer.append("div")
        .attr("class", "filters breakout-filters");
    }

    this.activeGroups.forEach(group => {
      filterDiv.append("div")
        .attr("class", "filter-btn active")
        .style("--btn-color", this.colorMap[group])
        .text(group)
        .on("click", (event) => {
          const btn = d3.select(event.currentTarget);
          if (btn.classed("active")) {
            btn.classed("active", false).classed("inactive", true);
            this.activeGroups = this.activeGroups.filter(g => g !== group);
          } else {
            btn.classed("active", true).classed("inactive", false);
            this.activeGroups.push(group);
          }
          this.updatePlot();
        });
    });
  }

  _initTooltip() {
    // inject tooltip div if not present
    let tt = this.container.select(".tooltip");
    if (tt.empty()) {
      tt = this.container.append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute");
    }
    this.tooltip = tt;
  }

  updatePlot() {
    const filteredData = this.breakoutField
      ? this.data.filter(d => this.activeGroups.includes(d[this.breakoutField]))
      : this.data;
    this._setXDomain(filteredData);
    this._setYDomain(filteredData);
    this._updateAxes();
    this.plotLogic(filteredData);
  }

  _setXDomain(filteredData) {
    if (this.isXQualitative) {
      this.x.domain(filteredData.map(d => d[this.xField]));
    } else {
      this.x.domain([0, d3.max(filteredData, d => d[this.xField]) * 1.05 || 1]);
    }
  }

  _setYDomain(filteredData) {
    this.y.domain([0, d3.max(filteredData, d => d[this.yField]) * 1.05 || 1]);
  }

  _updateAxes() {
    if (this.xAxisArgs.show) {
      let axisX = d3.axisBottom(this.x).ticks(this.xAxisArgs.ticks);
      if (this.xAxisArgs.tickFormat) axisX.tickFormat(this.xAxisArgs.tickFormat);
      axisX.tickSize(-this.innerHeight);
      this.xAxis.transition().duration(750).call(axisX);
      this.xAxis.select(".domain").remove();
    }

    if (this.yAxisArgs.show) {
      let axisY = d3.axisLeft(this.y).ticks(this.yAxisArgs.ticks);
      if (this.yAxisArgs.tickFormat) axisY.tickFormat(this.yAxisArgs.tickFormat);
      axisY.tickSize(-this.innerWidth);
      this.yAxis.transition().duration(750).call(axisY);
      this.yAxis.select(".domain").remove();
    }
  }

  // abstract
  plotLogic(_) {
    throw new Error("plotLogic must be implemented by subclass");
  }

  color(d) {
    if (this.breakoutField) {
      return this.colorMap[d[this.breakoutField]] || "gray";
    } else {
      return this.colorMap["default"];
    }
  }

  _attachTooltip(selection) {
    if (!this.tooltipConfig.text) return selection;

    selection
      .on("mouseover", (event, d) => {
        const bounds = d3.select(`#${this.containerId}`).node().getBoundingClientRect();
        this.tooltip.transition().duration(this.tooltipConfig.inDuration).style("opacity", 1);
        this.tooltip.html(this.tooltipConfig.text(d))
          .style("left", (event.pageX + this.tooltipConfig.xOffset) + "px")
          .style("top", (event.pageY + this.tooltipConfig.yOffset) + "px");
      })
      .on("mouseout", () => {
        this.tooltip.transition().duration(this.tooltipConfig.outDuration).style("opacity", 0);
      });

    return selection;
  }

  _attachHover(selection) {
    const self = this;
    selection
      .on("mouseover.hover", function(event, d) {
        d3.select(this).classed("focused", true);
        self.svg.classed("focused", true);
      })
      .on("mouseout.hover", function(event, d) {
        d3.select(this).classed("focused", false);
        self.svg.classed("focused", false);
      });

    return selection;
  }
}