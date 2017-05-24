import * as d3 from "d3";

export default function(cm, cytobands, peeker) {

	const giemsaScale = d3.scaleOrdinal()
		.domain(["gneg",    "gpos25",  "gpos50",  "gpos75",  "gpos100", "acen",    "stalk",   "gvar"])
		.range([ "#f0f0f0", "#e0e0e0", "#d0d0d0", "#c0c0c0", "#a0a0a0", "#cc4444", "#338833", "#000000"]);

	// SVG in Chrome can not handle coordinates and transformations with arbitrarily large numbers
	const downscaleFactor = 1000000;

	var cytobandGroup, cytobandLabelGroup;

	return {
		height: function() {
			return 20;
		},

		onAddTrack: function (trackGroup) {
			cytobands.sort((a, b) => cm.linLoc([a.chrom, a.start]) - cm.linLoc([b.chrom, b.start]));

			cytobands.forEach(row => row.linearCenter = cm.linLoc([row.chrom, (row.start + row.end) / 2]));

			cytobandGroup = trackGroup.append("g")
				.attr("class", "cytoband-bands");

			const newRects = cytobandGroup.selectAll("rect")
				.data(cytobands, row => row.chrom + ":" + row.start)
				.enter()
				.append("rect")
				.attr("height", this.height())
				.attr("x", d => cm.linLoc([d.chrom, d.start]) / downscaleFactor)
				.attr("width", d => (cm.linLoc([d.chrom, d.end]) - cm.linLoc([d.chrom, d.start])) / downscaleFactor)
				.attr("fill", d => giemsaScale(d.gieStain));

			if (peeker) {
				newRects.on("mouseover", d => peeker.mouseOver(d));
				newRects.on("mouseout", d => peeker.mouseOut());
			}

			cytobandLabelGroup = trackGroup.append("g")
				.attr("class", "cytoband-labels")
				.attr("pointer-events", "none"); // TODO: To css
		},

		zoomed: function(transform, scaledX) {

			const visibleDomain = scaledX.domain();
			const visibleDomainWidth = visibleDomain[1] - visibleDomain[0];
			const rangeWidth = scaledX.range()[1] - scaledX.range()[0];
			const k = rangeWidth / visibleDomainWidth * downscaleFactor;

			cytobandGroup.attr("transform", "translate(" + transform.x + " 0) scale(" + k + " 1)");

			// Display labels when the visible domain is smaller than an arbitrarily selected threshold
			if (visibleDomainWidth < 150 * 1000000) {
				const labels = cytobandLabelGroup.selectAll("text")
					.data(cytobands.filter(
						// TODO: Binary search & slice
						d => d.linearCenter > visibleDomain[0] && d.linearCenter < visibleDomain[1]),
						d => d.linearCenter);

				labels.exit()
					.remove();

				labels.enter()
					.append("text")
					.text(d => d.chrom.substring(3) + d.name)
					.attr("text-anchor", "middle")
					.attr("y", this.height() / 2)
					.merge(labels)
					.attr("transform", d => "translate(" + scaledX(d.linearCenter) + " 0)");

				labels.each(function(d) {
					const t = d3.select(this);

					if (!t.attr("bb_width")) {
						// Calculating BBox is expensive. Store it in an attribute.
						t.attr("bb_width", this.getBBox().width);
					}

					t.attr("visibility", x => t.attr("bb_width") < scaledX(cm.linLoc([d.chrom, d.end])) - scaledX(cm.linLoc([d.chrom, d.start])) ? null: "hidden");
				});

				cytobandLabelGroup.attr("visibility", "visible");

			} else {
				cytobandLabelGroup.attr("visibility", "hidden");
			}
		},

		/**
		 * Find a range of cytobands using the search string as a prefix
		 */
		search: function(string) {
			const f = /^[0-9]+$/.test(string) ?
				d => d.chrom.substring(3) == string :
				d => (d.chrom.substring(3) + d.name).startsWith(string);

			const bands = cytobands.filter(f);

			if (bands.length > 0) {
				return [
					Math.min.apply(null, bands.map(b => b.linearCenter - (b.end - b.start) / 2)),
					Math.max.apply(null, bands.map(b => b.linearCenter + (b.end - b.start) / 2))
				];
			}
		},

		searchHelp: function() {
			return `<p>Zoom in to a cytoband, arm or chromosome. Examples:</p>
			<ul>
				<li>8p11.23</li>
				<li>8p11</li>
				<li>8p</li>
				<li>8</li>
			</ul>`;
		}
	}
}



export function parseCytobandTsv(cytobandTsv) {
	const cytobands = d3.tsvParseRows(cytobandTsv).map(row => ({
		chrom: row[0],
		start: +row[1],
		end: +row[2],
		name: row[3],
		gieStain: row[4]
	})).filter(b => /^chr[0-9XY]{1,2}$/.test(b.chrom));

	return cytobands;
}


export function extractChromSizes(cytobands) {
	const chromSizes = {};

	cytobands.forEach(row => {
			const chrom = row.chrom;
			chromSizes[chrom] = Math.max(chromSizes.hasOwnProperty(chrom) ? chromSizes[chrom] : 0, row.end);
		});

	return chromSizes;
}

