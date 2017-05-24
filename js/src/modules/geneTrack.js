import * as d3 from "d3";

// When something becomes visible. The values are the width of the visible domain in base pairs
const overviewBreakpoint = 250 * 1000000;
const transcriptBreakpoint = 10 * 1000000;

/**
 * Builds a gene annotation track.
 * See utils/compressRefGene.py
 */
export default function geneTrack(geneData, { title = null, peeker = null }) {

	const transcriptOpacityScale = d3.scaleLinear()
		.domain([1.2, 0.8].map(d => d * transcriptBreakpoint))
		.range([0, 1])
		.clamp(true);

	const overviewOpacityScale = d3.scaleLinear()
		.domain([1.2, 0.8].map(d => d * overviewBreakpoint)
			.concat([1.2, 0.8].map(d => d * transcriptBreakpoint)))
		.range([0, 1, 1, 0])
		.clamp(true);

	const opacityGamma = o => Math.pow(o, 1.8);

	var geneGroup;
	var overviewGroup;
	var placeholder;

	return {
		height: function() {
			return 100;
		},

		onAddTrack: function(trackGroup, axisGroup) {

			// Required for pointer events (zoom & pan)
			trackGroup.append("rect")
				.attr("fill", "none")
				.attr("height", this.height())
				.attr("width", 2000); // TODO: Get exact width from range

			placeholder = trackGroup.append("text")
				.attr("text-anchor", "middle")
				.attr("fill", "black")
				.attr("y", this.height() / 2)
				.text("Zoom in to see some transcripts!");

			overviewGroup = trackGroup.append("g")
				.attr("class", "gene-overview-group");

			geneGroup = trackGroup.append("g")
				.attr("class", "gene-group");


			if (title != null) {
				axisGroup.append("g")
					.attr("transform", `translate(-40, ${this.height() / 2})`)
					.append("text")
					.attr("text-anchor", "middle")
					.attr("transform", "rotate(-90)")
					.attr("fill", "black")
					.text(title);
			}
		},

		zoomed: function(transform, scaledX) {
			const visibleDomain = scaledX.domain();
			const visibleDomainWidth = visibleDomain[1] - visibleDomain[0];

			placeholder.attr("x", (scaledX.range()[1] - scaledX.range()[0]) / 2)
				.attr("opacity", 1 - transcriptOpacityScale(visibleDomainWidth));

			if (overviewOpacityScale(visibleDomainWidth) > 0) {
				overviewGroup.attr("opacity", opacityGamma(overviewOpacityScale(visibleDomainWidth)));
				const visibleUnions = geneData.union.filter(g => g.end >= visibleDomain[0] && g.start <= visibleDomain[1])

				const unions = overviewGroup.selectAll("rect")
					.data(visibleUnions, g => g.id);
				
				unions.exit()
					.remove();
				
				const enteringUnions = unions.enter()
					.append("rect")
					.attr("x", 0)
					.attr("width", 1)
					.attr("y", 0)
					.attr("height", 11)
					.attr("fill", "#c0c0c0");

				enteringUnions.merge(unions)
					.attr("transform", d => "translate(" + scaledX(d.start) + " 0)" +
						" scale(" + (scaledX(d.end) - scaledX(d.start)) + " 1)");

				overviewGroup.attr("visibility", "visible");

			} else {
				overviewGroup.attr("visibility", "hidden");
				overviewGroup.selectAll("rect").remove();
			}


			if (transcriptOpacityScale(visibleDomainWidth) > 0) {
				geneGroup.attr("opacity", opacityGamma(transcriptOpacityScale(visibleDomainWidth)));

				// TODO: Should use Intervel Tree here. Let's use a naive binary search kludge for now.
				const bs = d3.bisector(d => d.linearStart).left;

				const visibleGenes = geneData.slice(
					bs(geneData, visibleDomain[0] - 3 * 1000000), // Assume that genes are shorter than x
					bs(geneData, visibleDomain[1]))
					.filter(g => g.linearEnd >= visibleDomain[0] && g.linearStart <= visibleDomain[1]);

				const genes = geneGroup.selectAll("g[data-id]")
					.data(visibleGenes, g => g.id);

				genes.exit()
					.remove();

				const enteringGenes = genes.enter()
					.append("g")
					.attr("data-id", d => d.id);

				/*
				enteringGenes.append("title")
					.text(d => (d.strand == "-" ? ">" : "<") + " " + d.symbol + " " + d.id);
				*/

				if (peeker) {
					enteringGenes.on("mouseover", d => peeker.mouseOver({
						id: d.id,
						symbol: d.symbol,
						direction: (d.strand == "-" ? "5' ---> 3' (- strand)" : "3' <--- 5' (+ strand)"),
						length: d.linearEnd - d.linearStart
					}));
					enteringGenes.on("mouseout", d => peeker.mouseOut());
				}

				enteringGenes.append("rect")
					.attr("x", 0)
					.attr("width", d => d.end - d.start)
					.attr("y", 5)
					.attr("height", 1)
					.attr("fill", "#000000");

				// Needed for mouse events
				enteringGenes.append("rect")
					.attr("height", 12)
					.attr("x", 0)
					.attr("width", d => d.end - d.start)
					.attr("y", 0)
					.attr("fill", "none");

				enteringGenes.append("g")
					.selectAll("rect")
					.data(d => {
						const cumulativeExons = d.exons.split(",")
							.map(x => parseInt(x, 10))
							.reduce(function(r, c, i) { r.push((r[i-1] || 0) + c); return r }, []);

						const exons = [];

						// TODO: Use Javascript generators
						for (var i = 0; i < cumulativeExons.length / 2; i++) {
							exons.push([cumulativeExons[i * 2], cumulativeExons[i * 2 + 1]]);
						}

						return exons;
					})
					.enter()
					.append("rect")
					.attr("x", e => e[0])
					.attr("width", e => e[1] - e[0])
					.attr("y", 0)
					.attr("height", 11);

				enteringGenes.merge(genes)
					.attr("transform", d => "translate(" + scaledX(d.linearStart) + " " + (d.lane * 12) + ")" +
						" scale(" + ((scaledX(d.end) - scaledX(d.start)) / (d.end - d.start)) + " 1)");

				geneGroup.attr("visibility", "visible");

			} else {
				geneGroup.attr("visibility", "hidden");
				geneGroup.selectAll("g").remove();
			}
		},

		onBrush: function(start, end, outputElement) {
			//const genes = geneData.filter(g => g.linearEnd >= start && g.linearStart <= end);
			const genes = d3.map(geneData.filter(g => g.linearEnd >= start && g.linearStart <= end), d => d.symbol).keys().sort();

			const div = outputElement.append("div");
			div.append("h2").text("Genes and transcripts:");

			if (genes.length < 300) {
				var geneList = div.append("ul")
					.selectAll("li")
					.data(genes);
				
				geneList.enter()
					.append("li")
					.text(d => d)
					.style("cursor", "pointer")
					.on("click", d => window.open("https://www.ncbi.nlm.nih.gov/gene/?term=" + d, "refseq"));

			} else {
				div.append("p").text(`Selection contains ${genes.length} genes or transcripts. Please select a smaller range to get a list.`);
			}
		},

		search: function(string) {
			string = string.toUpperCase();

			// TODO: Use array.find (not supported in older browsers)
			const results = geneData.filter(d => d.symbol == string);
			if (results.length > 0) {
				// Find the longest matching transcript
				results.sort((a, b) => (b.linearEnd - b.linearStart) - (a.linearEnd - a.linearStart));
				const r = results[0];

				// Add some padding around the gene
				const regionWidth = r.linearEnd - r.linearStart;
				const padding = regionWidth * 0.25;
				return [r.linearStart - padding, r.linearEnd + padding];
			}
		},

		searchHelp: function() {
			return `<p>Find a gene or transcript. Examples:</p>
			<ul>
				<li>BRCA1</li>
				<li>TP53</li>
			</ul>`;
		}
	}
}


export function parseCompressedRefseqGeneTsv(cm, geneTsv) {
	const genes = d3.tsvParseRows(geneTsv).map(row => {

		const start = parseInt(row[3], 10);
		const end =   start + parseInt(row[4], 10);

		return {
			id:     row[0],
			symbol: row[1],
			chrom:  row[2],
			start:  start,
			end:    end,
			strand: row[5],
			exons:  row[6],
			// Precalc for optimization
			linearStart: cm.chromStart(row[2]) + start,
			linearEnd: cm.chromStart(row[2]) + end
		}
	}).filter(g => typeof cm.chromStart(g.chrom) == "number");

	genes.sort((a, b) => a.linearStart - b.linearStart);

	const lanes = [];

	genes.forEach(g => {
		let laneNumber = lanes.findIndex(end => end < g.linearEnd);
		if (laneNumber < 0) {
			laneNumber = lanes.push(0) - 1;
		}
		lanes[laneNumber] = g.linearEnd;
		g.lane = laneNumber;
	});

	// For overview purposes we create a union of overlapping transcripts
	// and merge adjacent segments that are close enough to each other

	const mergeDistance = 75000;

	var concurrentCount = 0;
	genes.union = [];
	var leftEdge = null;
	var previousEnd = 0;
	var index = 0;

	genes.map(g => ({pos: g.linearStart, start: true}))
		.concat(genes.map(g => ({pos: g.linearEnd, start: false})))
		.sort((a, b) => a.pos - b.pos)
		.forEach(edge => {
			if (edge.start) {
				if (concurrentCount == 0) {
					if (leftEdge == null) {
						leftEdge = edge.pos;
					}

					if (edge.pos - previousEnd > mergeDistance) {
						genes.union.push({ id: index, start: leftEdge, end: previousEnd });
						leftEdge = edge.pos;
						index++;
					}

				}
				concurrentCount++;
			}

			if (!edge.start) {
				concurrentCount--;
				previousEnd = edge.pos;
			}

		});

	if (leftEdge) {
		genes.union.push({ id: index, start: leftEdge, end: previousEnd });
	}

	return genes;
}


