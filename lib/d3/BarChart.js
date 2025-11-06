import * as d3 from "d3";
import { D3Plot } from "./D3Plot";

/**
 * Simple categorical bar chart.
 * Expects:
 *  - xField: string category (e.g., "Nov 3")
 *  - yField: numeric value (e.g., hours)
 */
export class BarChart extends D3Plot {
  constructor(args) {
    // Force qualitative X for a band scale
    super({ ...args, isXQualitative: true });

    // Optional customization
    this.barPadding = args.barPadding ?? 0.15; // extra internal padding if desired
    if (this.x.bandwidth) {
      // If the parent already set band scale, add padding
      this.x.padding(this.barPadding);
    }
  }

  plotLogic(filteredData) {
    // JOIN
    const bars = this.g.selectAll("rect.bar")
      .data(filteredData, d => d[this.xField]);

    // ENTER
    bars.enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => this.x(d[this.xField]))
      .attr("y", this.y(0))
      .attr("width", this.x.bandwidth())
      .attr("height", 0)
      .attr("fill", d => this.color(d))
      .call(sel => this._attachTooltip(sel))
      .call(sel => this._attachHover(sel))
      .transition().duration(750)
      .attr("y", d => this.y(d[this.yField]))
      .attr("height", d => this.innerHeight - this.y(d[this.yField]));

    // UPDATE
    bars
      .transition().duration(750)
      .attr("x", d => this.x(d[this.xField]))
      .attr("width", this.x.bandwidth())
      .attr("y", d => this.y(d[this.yField]))
      .attr("height", d => this.innerHeight - this.y(d[this.yField]))
      .attr("fill", d => this.color(d));

    // EXIT
    bars.exit().transition().duration(500)
      .attr("y", this.y(0))
      .attr("height", 0)
      .remove();
  }
}
