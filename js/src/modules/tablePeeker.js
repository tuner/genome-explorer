
import * as d3 from "d3";

"use strict";

export default function(container) {

	//table.style("position", "relative");
	//d3table.style("top", "-110px");

	
	const tBody = container.attr("class", "peeker-wrapper")
		.append("table")
		.attr("class", "peeker")
		.append("tbody");

	container.style("visibility", "hidden");

	return {
		mouseOver: function(object) {
			const tableRows = tBody.selectAll("tr")
				.data(Object.keys(object).map(k => [k, object[k]]), d => d[0]);

			tableRows.enter()
				.append("tr")
				.selectAll("td")
				.data(d => d)
				.enter()
				.append("td")
				.merge(tableRows)
				.text(d => d);

			tableRows.exit()
				.remove();

			container.style("visibility", Object.keys(object).length ? "visible" : "hidden");
		},

		mouseOut: function() {
			this.mouseOver({});
		}

		// TODO: Click
	}
}
