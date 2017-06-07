import * as d3 from "d3";

/** Legacy */
export function absoluteAndChange(config) { 
	return function decorate(newBars) {
		const absoluteScale = d3.scaleSequential(d3.interpolatePlasma)
			.domain([0.2, 0.8]); // Emphasize

		const deltaScale = x => x * 2

		newBars.append("rect")
			.attr("height", d => deltaScale(Math.abs(d.data.R_met - d.data.D_met)) / 2)
			.attr("y", d => (d.data.R_met - d.data.D_met) > 0 ? (1 - deltaScale(Math.abs(d.data.R_met - d.data.D_met))) / 2 : 1 / 2)
			.attr("width", 1)
			.attr("fill", d => absoluteScale(d.data.D_met));

	}
}

/** Legacy */
export function islands(config) {
	return function decorate(newBars) {
		const color = d3.scaleLinear()
			.domain([0.1, 0.3, 1, 3, 10])
			.range(["#0000e0", "#0090ff", "#ffffff", "#ff9000", "#e00000"]); 

		const cgiScale = d3.scaleBand()
			.domain(["island", "shore", "sea"]);

		newBars.append("rect")
			.attr("height", 1)
			.attr("width", 1)
			.attr("fill", d => { const c = d3.color(color(d.data.R_met / d.data.D_met)); c.opacity = 0.3; return c; });

		newBars.append("rect")
			.attr("height", cgiScale.bandwidth())
			.attr("width", 1)
			.attr("y", d => cgiScale(d.data.cgi))
			.attr("fill", d => d3.color(color(d.data.R_met / d.data.D_met)).darker(0.3));
	}
}

/**
 * A visualization that fills a fraction of either the upper or lower part of the segment
 * depending on the sign of the data.
 * 
 * TODO: Adapt to min/max values, produce a legend
 */
export function upOrDown(segmentTrack, config) {
	if (!config.height) {
		// TODO: An exception or something
		alert("upOrDown visualization requires the 'height' config option!");
	}

	function clamp(x) {
		return Math.max(Math.min(x, 1), -1);
	}

	return function decorate(newBars) {
		newBars.append("rect")
			.attr("height", d => Math.abs(clamp(d.data[config.height])))
			.attr("y", d => clamp(d.data[config.height]) > 0 ? (0.5 - clamp(d.data[config.height])) : 0.5)
			.attr("width", 1)
			.attr("fill", d => d.data[config.height] > 0 ? "#cc3333" : "#3333cc")
	}
}

/** Legacy */
export function expression(config) {
	return function decorate(newBars) {
		const relativeDifference = (a, b) => (Math.pow(2, a) - Math.pow(2, b)) / Math.pow(2, Math.max(a, b));
		const diff = d => relativeDifference(d.data.R_expr, d.data.D_expr);

		newBars.append("rect")
			.attr("height", d => Math.abs(diff(d)))
			.attr("y", d => diff(d) > 0 ? (0.5 - diff(d)) : 0.5)
			.attr("width", 1)
			.attr("fill", d => diff(d) > 0 ? "#cc3333" : "#3333cc")

	}
}

/** Legacy */
export function simpleContinuous(config) {
	const cnvScale = d3.scaleLinear()
		.domain([-3, 0, 1.5])
		.range(["blue", "white", "red"]);

	const decorate = function decorate(newBars) {
		const rects = newBars.append("rect")
			.attr("height", 1)
			.attr("y", 0)
			.attr("width", 1);

		if (config && config.color) {
			rects.attr("fill", d => colorScale(d.data[config.color]));
		} else {
			rects.attr("fill", colorScale(0));
		}
	}

	return decorate;
}

export function cnvAndBaf(config) {
	const colorScale = d3.scaleLinear()
		.domain([-3, 0, 1.5])
		.range(["blue", "white", "red"]);

	const decorate = function decorate(newBars) {
		const bafDefaultColor = d3.hsl(0, 0, 180);

		if (config) {
			if (config.cnv) {
				let rects = newBars.append("rect")
					.attr("height", 1)
					.attr("y", 0)
					.attr("width", 1);

				rects.attr("fill", d => colorScale(d.data[config.cnv]));
			}

			if (config.baf) {
				let h = function(b) {
					let freq = b.data[config.baf];
					return Number.isNaN(freq) ? 0 : Math.abs(freq - 0.5) * 2;
				}

				let rects = newBars.append("rect")
					.attr("height", h)
					.attr("y", d => 1 - h(d))
					.attr("width", 1)
					.attr("fill", "rgba(0, 0, 0, 0.3)")
			}
		}
	}

	return decorate;
}


/**
 * A simple visualization that fills the segment with a color based on a the data.
 * 
 * @param config config
 */
export function simple(config) {
	var colorScale;

	// For categorial variable 
	var factors;

	// For continuous variable
	var domain;

	const decorate = function decorate(newBars) {
		const rects = newBars.append("rect")
			.attr("height", 1)
			.attr("y", 0)
			.attr("width", 1);

		if (colorScale) {
			rects.attr("fill", d => colorScale(d.data[config.color]));
		} else {
			rects.attr("fill", "#5E81C5");
		}
	}

	/**
	 * Figure out the type of the data being visualized and create a colorScale
	 */
	decorate.evaluateData = function evaluateData(data) {
		if (config && config.color) {
			let first = data.map(d => d.data[config.color]).find(d => d);

			const colorPalette = Array.isArray(config.colorPalette) ?
				config.colorPalette : null;

			if (typeof first == "number") {
				if (Array.isArray(config.domain) && config.domain.length == 2) {
					domain = config.domain;

				} else {
				// Assume a continuous variable
					domain = data.map(d => d.data[config.color])
						.reduce((acc, val) => [Math.min(acc[0], val), Math.max(acc[1], val)],
						[Infinity, -Infinity]);
				}

				if (colorPalette) {
					colorScale = d3.scaleSequential(
						d3.interpolateRgbBasis(colorPalette))
						.domain(domain);

				} else if (domain[0] < 0 && 0 < domain[1]) {
					colorScale = d3.scaleLinear()
						.domain([domain[0], 0, domain[1]])
						.range(["#128be8", "#F0F0F0", "#db1e18"]);
				} else {
					colorScale = d3.scaleSequential(
						d3.interpolateRgbBasis(["#128be8", "#c071e8", "#db1e18"]))
						.domain(domain);
				}

			} else {
				// Assume a nominal categorial variable
				if (Array.isArray(config.domain)) {
					factors = config.domain;
				} else {
					factors = d3.map(data, d => d.data[config.color]).keys();
				}

				colorScale = colorPalette ?
					d3.scaleOrdinal(colorPalette) :
					d3.scaleOrdinal(factors.length <= 10 ? d3.schemeCategory10 : d3.schemeCategory20);
			}
		}
	}

	decorate.produceLegend = function produceLegend(container, trackTitle) {
		if (factors || domain) {
			const legend = container
				.append("div")
				.attr("class", "legend")
				.append("div");

/*
			legend.append("div")
				.attr("class", "legend-title")
				.text("");
				*/

			if (trackTitle && trackTitle != "") {
				legend.append("span")
					.text(trackTitle + " - ");
			}

			legend.append("span")
				.text(config.color + ": ");

			const size = 12;

			if (domain) {
				const min = domain[0];
				const max = domain[1];

				const item = legend.append("span")
					.attr("class", "legend-item");

				item.append("span")
					.attr("class", "legend-label")
					.text(min);

				const svg = item.append("svg")
					.attr("class", "legend-color")
					.attr("width", size * 8)
					.attr("height", size);

				const gradientId = Math.random().toString(36).substr(2, 5); 

				svg.append("defs")
					.append("linearGradient")
					.attr("id", gradientId)
					.selectAll("stop")
					.data([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
						.map(x => x / 10))
					.enter()
					.append("stop")
					.attr("offset", x => x * 100 + "%")
					.attr("stop-color", x => colorScale(min + x * (max - min)));

				svg.append("rect")
					.attr("width", size * 8)
					.attr("height", size)
					.attr("fill", `url(#${gradientId})`);

				item.append("span")
					.attr("class", "legend-label")
					.text(max);

			} else if (factors) {

				const items = legend.selectAll("div.legend-item")
					.data(factors || domain)
					.enter()
					.append("div")
					.attr("class", "legend-item");

				// Background color of html elements is not visible in prints by default,
				// let's use svg rectangles instead
				items.append("svg")
					.attr("class", "legend-color")
					.attr("width", size)
					.attr("height", size)
					.append("rect")
					.attr("width", size)
					.attr("height", size)
					.attr("fill", d => colorScale(d));

				items.append("span")
					.attr("class", "legend-label")
					.text(d => d);

			} else {
				// ???
			}

		}
	}

	return decorate;
}
