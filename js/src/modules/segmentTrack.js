import * as d3 from "d3";
import {rangeUnion} from "./utils"

export default function(cm, data, vis, { title = "", peeker = "", samples = null, sampleLabels = null, barSize = 35, barPadding = 0.3 }) {
	var bars = null;

	const compact = barSize * (1 + barPadding) < 15; // Don't show labels

	// Figure out samples from the data if they were not explicitly defined
	const sampleDomain = samples != null ? samples : d3.map(data, d => d.category).keys().sort();

	const y = d3.scaleBand()
		.domain(sampleDomain)
		.padding(barPadding);

	y.range([0, sampleDomain.length * barSize]);

	const yAxis = d3.axisLeft()
		.scale(y)
		.tickFormat(sampleLabels != null ? lookupFormat(samples, sampleLabels) : identityFormat());

	const xGrid = d3.axisBottom()
		.tickValues(cm.linearChromPositions())
		.tickFormat("")

	var gridYGroup, gridXGroup;
	var _trackGroup;
	var _axisGroup;

	var barGroup;

	var groupScaledPrevious = false;

	var pristine = true;

	return {
		height: function() {
			return sampleDomain.length * barSize;
		},

		onAddTrack: function(trackGroup, axisGroup, callbacks) {
			gridYGroup = null;
			gridXGroup = null;
			bars = null;
			pristine = true;
			groupScaledPrevious = false;

			_trackGroup = trackGroup;
			_axisGroup = axisGroup;

			if (!compact) {
				_axisGroup.attr("class", "y axis")
					.call(yAxis);
			}

			axisGroup.append("g")
				.attr("transform", `translate(-60, ${this.height() / 2})`)
			.append("text")
				.attr("text-anchor", "middle")
				.attr("transform", "rotate(-90)")
				.attr("fill", "black")
				.text(title);

			barGroup = trackGroup.append("g")
				.attr("class", "bars");

			if (vis.evaluateData) vis.evaluateData(data);

			if (vis.produceLegend) vis.produceLegend(callbacks.legends(), title);

		},

		zoomed: function (transform, scaledX) {
			if (pristine) {
				// add the Y gridlines
				gridYGroup = _trackGroup.insert("g", ":first-child")			
					.attr("class", "grid y")
					.attr("transform", "translate(1 0)")
					.call(d3.axisLeft()
						.scale(y)
							.tickSize(scaledX.range()[0] - scaledX.range()[1] - 1)
							.tickFormat("")
					);

				gridXGroup = _trackGroup.insert("g", ":first-child")
					.attr("class", "grid x")
					.attr("transform", `translate(0 ${this.height()})`) ;
				
				pristine = false;
			}

			// ---

			const visibleDomain = scaledX.domain();
			const visibleDomainWidth = visibleDomain[1] - visibleDomain[0];


			const k = transform.k;

			const useGroupScaling = k < 4;

			// TODO: Fix the duplicated code below

			// Assume that initially k is zero.
			if (useGroupScaling) {
				// Ensure that all data is bound when scaling is used
				if (pristine || bars == null || bars.size() != data.length) {
					// Bind all data
					bars = barGroup.selectAll("g.bar")
						.data(data, d => d.category + "_" + d.linearStart);

					const exit = bars.exit();
					exit.remove()

					const newBars = bars.enter()
						.append("g")
						.attr("class", "bar");

					vis(newBars);

					bars = newBars.merge(bars);

					if (peeker) {
						newBars.on("mouseover", d => peeker.mouseOver(d.data));
						newBars.on("mouseout", d => peeker.mouseOut());
					}

				}

				if (!groupScaledPrevious) {
					const x = d3.scaleLinear()
						.range(scaledX.range())
						.domain(cm.extent());

					const minWidth = Math.min(1, ((1 - 1) * 0.5 + 1) * 0.2);
					bars.attr("transform", d => "translate(" + x(d.linearStart) + " " + y(d.category) + ")"
						+ " scale(" + Math.max(minWidth, x(d.linearEnd) - x(d.linearStart)) + " " + y.bandwidth() + ")");
				}

				barGroup.attr("transform", "translate(" + transform.x + " 0) scale(" + k + " 1)");


			} else {
				// Consider using an interval tree
				const visibleData = data.filter(g => g.linearEnd > visibleDomain[0] && g.linearStart < visibleDomain[1]);

				// D3.js is slow in selection and key binding
				bars = barGroup.selectAll("g.bar")
					.data(visibleData, d => d.category + "_" + d.linearStart);

				const exit = bars.exit();
				exit.remove()

				const newBars = bars.enter()
					.append("g")
					.attr("class", "bar");

				if (peeker) {
					newBars.on("mouseover", d => peeker.mouseOver(d.data));
					newBars.on("mouseout", d => peeker.mouseOut());
				}

				vis(newBars);
				bars = newBars.merge(bars);

				const minWidth = Math.min(1, ((k - 1) * 0.5 + 1) * 0.2);
				//const rangeWidth= scaledX.range()[1];

				// Safari (WebKit) breaks on overly large scale factors.
				// So, let's truncate coordinates to range boundaries.
				scaledX.clamp(true);

				bars.attr("transform", d => {
					let x1 = scaledX(d.linearStart);
					let x2 = scaledX(d.linearEnd);
					let scale = Math.max(minWidth, x2 - x1);

					return "translate(" + x1 + " " + y(d.category) + ")" + " scale(" + scale + " " + y.bandwidth() + ")";
				});

				scaledX.clamp(false);

				barGroup.attr("transform", "translate(0 0) scale(1 1)");
			}

			groupScaledPrevious = useGroupScaling;

			xGrid.scale(scaledX);
			xGrid.tickSize(-this.height());

			gridXGroup.call(xGrid);
		},

		search: function(string) {
			if (string == "data") {
				// A special keyword!
				// Find a range that accommodates all segmenst
				const result = data.map(d => [d.linearStart, d.linearEnd])
					.reduce(rangeUnion, null);

				if (result) {
					const rangeWidth = result[1] - result[0];
					const padding = rangeWidth * 0.25;
					return [result[0] - padding, result[1] + padding];

				} else {
					return null;
				}
			}
		}
	}
}

function identityFormat() {
	return value => value;
}

function lookupFormat(values, replacements) {
	if (values.length != replacements.length) {
		throw "lookupFormat: length of values and replacements do not match!";
	}

	const lookupTable = {};
	for (var i = 0; i < values.length; i++) {
		lookupTable[values[i]] = replacements[i];
	}

	return value => lookupTable[value];
}
