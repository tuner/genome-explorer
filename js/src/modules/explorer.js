import * as d3 from "d3";

"use strict";

var instanceCounter = 0;

const numberFormat = d3.format(",d");

function explorer(container, cm, tracks, { transform = null }) {

	/**
	 * Returns a UCSC Genome Browser -style string presentation of the domain.
	 * However, the domain may span multiple chromosomes, which is incompatible
	 * with UCSC.
	 */
	function domainToString(domain) {
		const [from, to] = domain;

		const f = numberFormat;

		// Display as 1-indexed closed range
		// See https://genome.ucsc.edu/FAQ/FAQtracks#tracks1
		if (from[0] == to[0]) {
			return from[0] + ":" + f(from[1] + 1) + "-" + f(to[1]);
		} else {
			return from[0] + ":" + f(from[1] + 1) + "-" + to[0] + ":" + f(to[1]);
		}
	}
	
	var latestTransform = transform;
	var mappedDomain;

	var chart, background, rangeSearch;
	var x, scaledX, zoom;

	var width, height;

	var brushInfo;

	// TODO: Package brushing logic into an object

	/** Range selection start */
	var brushStart, brushEnd;
	var brushElement;
	var brushDomain;

	var instanceId = instanceCounter++;

	/**
	 * Handles mouse clicks.
	 * 
	 * First click creates a brush, second click ends brushing and displays
	 * information about the brushed region.
	 */
	function handleClick() {
		if (brushDomain != null && brushStart == null) {
			clearBrush();

		} else if (brushStart == null) {
			brushStart = scaledX.invert(d3.mouse(background.node())[0]);
			brushEnd = brushStart;

			brushDomain = [brushStart, brushStart];

			translateBrushElement();

		} else {
			if (brushDomain[1] != brushDomain[0]) {
				brushInfo.html("");

				//const domainLength = d3.format(",d").apply(brushDomain[1] - brushDomain[0]);
				const domainLength = numberFormat(brushDomain[1] - brushDomain[0]);

				brushInfo.append("h2").text("Selection:");
				const selectionInfo = brushInfo.append("p");

				selectionInfo.append("span")
					.text(domainToString(brushDomain.map(d => cm.chromLoc(d)))
					+ ` (${domainLength} bp)`);

				selectionInfo.append("button")
					.text("Zoom to selection")
					.on("click", () => zoomToDomain(brushDomain, clearBrush));

				selectionInfo.append("button")
					.text("Clear selection")
					.on("click", clearBrush);

				tracks.forEach(t => {
					if (t.onBrush) {
						t.onBrush(
							brushDomain[0],
							brushDomain[1],
							brushInfo);
					}
				});

			} else {
				clearBrush();
			}

			brushStart = null;
			brushEnd = null;
		}

	}

	function handleMouseMove() {
		if (brushStart != null) {
			brushEnd = scaledX.invert(d3.mouse(background.node())[0]);
			translateBrushElement();

			brushDomain = [
				Math.min(brushStart, brushEnd),
				Math.max(brushStart, brushEnd)
			];

		}
	}

	function translateBrushElement() {
		if (brushDomain &&!brushElement) {
			brushElement = chart.append("rect")
				.attr("class", "range-selector")
				.attr("y", 0.5)
				.attr("height", height - 1);
		}

		if (!brushDomain && brushElement) {
			brushElement.remove();
			brushElement = null;
		}

		if (brushElement != null && brushDomain) {
			const ts = scaledX(brushDomain[0]);
			const te = scaledX(brushDomain[1]);
			const width = te - ts;

			brushElement.attr("x", ts)
				.attr("width", width);
		}
	}

	function clearBrush() {
		brushInfo.html("");
		brushDomain = null;
		translateBrushElement();
	}

	/**
	 * Build the Explorer. Create the range/search field, legendes, and SVG with all the tracks.
	 */
	function build() {
		const margin =
			{
				right: 10,
				left: 70
			};

		height = tracks.map(t => t.height()).reduce((a, b) => a + b, 0);

		width = container.node().offsetWidth - margin.left - margin.right;

		const navigatorBar = container.append("div")
			.attr("class", "navigation-bar")
			.style("margin-left", margin.left + "px");

		navigatorBar.append("label")
			.attr("for", `visible-domain-${instanceId}`)
			.text("Range / search: ");

		const rangeSearchWrapper = navigatorBar.append("span")
			.attr("class", "range-search-wrapper");

		rangeSearch = rangeSearchWrapper.append("input")
			.attr("id", `visible-domain-${instanceId}`)
			.attr("class", "visible-domain");

		rangeSearch.node()
			.addEventListener("keypress", function (event) {
				if (event.keyCode == 13) {
					event.preventDefault();
					rangeSearchHelp.style("display", "none");
					search(this.value);
				}
			});

		const rangeSearchHelp = rangeSearchWrapper.append("div")
			.attr("class", "range-search-help")
			.style("display", "none")
			.html(searchHelp() +
			tracks.map(t => t.searchHelp ? t.searchHelp() : "")
				.reduce((acc, val) => acc + val, "")
			);

		rangeSearch.node()
			.addEventListener("focus", function (event) {
				this.select();

				rangeSearchHelp.style("display", "block");
			});

		rangeSearch.node()
			.addEventListener("mouseup", function (event) {
				// http://stackoverflow.com/questions/1269722/selecting-text-on-focus-using-jquery-not-working-in-safari-and-chrome
				event.preventDefault();
			});

		rangeSearch.node()
			.addEventListener("blur", function (event) {
				rangeSearchHelp.style("display", "none");
			});

		navigatorBar.append("button")
			.attr("class", "reset-zoom")
			.text("Reset zoom")
			.on("click", function () {
				chart.transition()
					.duration(750)
					.call(zoom.transform, d3.zoomIdentity);
			});

		navigatorBar.append("span")
			.attr("class", "zoom-hint")
			.text("Use the mouse wheel to zoom!");


		const legends = container.append("div")
			.attr("class", "legends")
			.style("margin-left", margin.left + "px");

		x = d3.scaleLinear()
			.domain(cm.extent())
			.range([0, width]);

		scaledX = x.copy();

		zoom = d3.zoom()
			.scaleExtent([1, cm.extent()[1] / width])
			.translateExtent([[cm.extent()[0], -Infinity], [cm.extent()[1], Infinity]]) // Upper bound not working!?
			.on("zoom", zoomed);

		chart = container
			.append("svg")
			.attr("class", "chart")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height)
			.append("g")
			.attr("transform", "translate(" + margin.left + " 0)")
			.on("click", handleClick)
			.on("mousemove", handleMouseMove)
			.call(zoom);

		brushInfo = container.append("div")
			.attr("class", "brush-info");

		background = chart.append("rect")
			.attr("class", "background")
			.attr("width", width)
			.attr("height", height)
			.attr("fill", "none");

		{
			let translateY = 0;
			let trackId = 0;

			let callbacks = {
				chromMapper: () => cm,
				legends: () => legends,
			}

			tracks.forEach(t => {
				const clipId = `${instanceId}-clip-track-${trackId}`;

				chart.append("clipPath")
					.attr("id", clipId)
					.append("rect")
					.attr("x", 0)
					.attr("y", 0)
					.attr("width", width)
					.attr("height", t.height());

				const trackGroup = chart.append("g")
					.attr("class", "ge-track")
					//.style("pointer-events", "all")
					.attr("clip-path", `url(#${clipId})`)
					.attr("transform", `translate(0 ${translateY})`);

				const axisGroup = chart.append("g")
					.attr("transform", `translate(0 ${translateY})`);

				translateY += t.height();
				trackId++;

				t.onAddTrack(trackGroup, axisGroup, callbacks);
			});
		}
	}


	function zoomed() {
		var transform = d3.event ? d3.event.transform : d3.zoomIdentity;

		applyZoom(transform);
	}

	function applyZoom(transform) {
		latestTransform = transform;

		scaledX = transform.rescaleX(x);

		mappedDomain = scaledX.domain().map(d => cm.chromLoc(d));
		rangeSearch.node().value = domainToString(mappedDomain);

		d3.select("#copy-to-clipboard")
			.attr("disabled", mappedDomain[0][0] == mappedDomain[1][0] ? null : "disabled");

		tracks.forEach(t => t.zoomed(transform, scaledX));

		translateBrushElement();
	}

	function zoomByTransform(transform) {
		zoom.transform(chart, transform);
	}

	function zoomToDomain(d, onEnd) {
		const transform = d3.zoomIdentity
			.scale(width / (x(d[1]) - x(d[0])))
			.translate(-x(d[0]), 0);

		chart.transition()
			.duration(750)
			// Assume that the transition was triggered by search when the duration is defined
			.on("end", onEnd ? onEnd : () => true)
			.call(zoom.transform, transform);

	}

	function searchHelp() {
		return `<p>Focus to a specific range. Examples:</p>
		<ul>
			<li>chr8:21,445,873-24,623,697</li>
			<li>chr4:166,014,727-chr15:23,731,397</li>
		</ul>`;
	}

	/**
	 * Search tracks for matches and zoom to match
	 */
	function search(string) {
		// Try to match a range
		const matches = string.match(/^(chr[0-9XY]+):([0-9,]+)-(?:(chr[0-9XY]+):)?([0-9,]+)$/);
		const afterZoom = () => rangeSearch.node().select();

		if (matches) {
			const startChr = matches[1];
			const endChr = matches[3] ? matches[3] : startChr;

			const startIndex = parseInt(matches[2].replace(/,/g, ""))
			const endIndex = parseInt(matches[4].replace(/,/g, ""))

			zoomToDomain([
				cm.linLoc([startChr, startIndex]),
				cm.linLoc([endChr, endIndex]),
				afterZoom
			]);

			return;
		}

		// Match by a single chromosome
		if (string.startsWith("chr") && cm.chromStart(string)) {
			zoomToDomain([cm.chromStart(string), cm.chromEnd(string)], afterZoom);
			return;
		}

		// Search tracks
		for (var t of tracks) {
			if (t.search) {
				const result = t.search(string);
				if (result) {
					zoomToDomain(result, afterZoom);
					return;
				}
			}
		}

		alert(`No matches found for "${string}"`);
	}

	build();
	zoomByTransform(transform != null ? transform : d3.zoomIdentity);

	return {
		currentTransform: () => d3.zoomIdentity.translate(latestTransform.x, 0).scale(latestTransform.k),

		//applyZoom: transform => zoom.transform(chart, transform),

		rebuild: function() {
			var origDomain = scaledX.domain();
			container.html("");
			build();
			zoomToDomain(origDomain);
		},

		getChart: function() {
			return chart;
		}
	}

};

export default explorer;
