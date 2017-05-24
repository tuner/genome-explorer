/**
 * genome-explorer
 *
 * Copyright © 2016 Kari Lavikka. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */


import { get } from "./modules/ajax";
import explorer from "./modules/explorer";
import chromMapper from "./modules/chromMapper";
import * as d3 from "d3";

import cytobandTrack, { parseCytobandTsv, extractChromSizes } from "./modules/cytobandTrack";
import axisTrack from "./modules/axisTrack";
import geneTrack, { parseCompressedRefseqGeneTsv } from "./modules/geneTrack";
import segmentTrack from "./modules/segmentTrack";

import * as visualizations from "./modules/visualizations";

import tablePeeker from "./modules/tablePeeker";

// Cache parsed annotations.
const annotationCache = {};

/**
 * Fetches, parses and caches gene annotations.
 * 
 * @param {string} url url to fetch
 * @param {object} cm ChromMapper
 * @param {function} callback What to do when ready
 */
function getOrFetchAnnotation(url, cm, callback) {
	if (annotationCache[url]) {
		callback(annotationCache[url]);

	} else {
		Promise.all([url].map(url => get(url)))
			.then(results => {
				const geneTsv = results[0];
				const genes = parseCompressedRefseqGeneTsv(cm, geneTsv);
				annotationCache[url] = genes;
				callback(genes);
			}, error => {
				alert(`Can't load annotations: ${error}, url: ${url}`);
			});
	}
}

/**
 * Wraps the given object in an array if it isn't already.
 * HTMLWidgets converts R vectors to arrays ... unless it has only one element.
 */
function ensureArray(a) {
	return a != null ? (Array.isArray(a) ? a : [a]) : null;
}

HTMLWidgets.widget({

	name: 'GenomeExplorer',
	type: 'output',

	factory: function(el, width, height) {

		// TODO: define shared variables for this instance

		const container = d3.select(el);

		const explorerDiv = container.append("div")
			.attr("class", "genome-explorer");

		var expl;

		// Handle peeker positioning
		const peekerTable = explorerDiv.append("div");

		const tp = tablePeeker(peekerTable);
		explorerDiv.on("mousemove", e => {
			const table = peekerTable.node();
			const explorerNode = explorerDiv.node();
			if (d3.mouse(explorerNode)[0] < explorerNode.offsetWidth / 2) {
				table.classList.add("right");
			} else {
				table.classList.remove("right");
			}
		});

		const innerExplorerDiv = explorerDiv.append("div")
			.attr("class", "inner-explorer-div");

		return {
			renderValue: function(x) {
				const cytobands = HTMLWidgets.dataframeToD3(x.cytobands)
					.filter(b => /^chr[0-9XY]{1,2}$/.test(b.chrom));

				const cm = chromMapper(extractChromSizes(cytobands));

				const tracks = [
					cytobandTrack(cm, cytobands, tp)
				]

				x.tracks.forEach((t, i) => {
					const colChrom = t.chrom ? t.chrom : "chrom";
					const colStart = t.start ? t.start : "start";
					const colEnd = t.end ? t.end : "end";

					var d3data;

					try {
						if (typeof t.data != "object" || t.data == null) {
							throw("Data is missing");
						}

						[colChrom, colStart, colEnd].forEach(colName => {
							if (!t.data[colName]) {
								throw(`Required coordinate column "${colName}" is missing from the data`);
							}
						})

						if (t.discriminator && !t.data[t.discriminator]) {
							throw(`Discriminator column "${t.discriminator}" is missing from the data`);
						}

					} catch (msg) {
						alert(`${msg} on track ${i + 1}!`);
						d3data = [];
					}

					if (d3data == null) {
						d3data = HTMLWidgets.dataframeToD3(t.data).map(d => {
							const chromStart = cm.chromStart(d[colChrom]);

							return {
								data: d,
								category: t.discriminator ? d[t.discriminator] : "",
								// Precalc for optimization
								linearStart: chromStart + d[colStart],
								linearEnd: chromStart + d[colEnd]
							}
						});
					}

					// Assume just segmentTracks.
					// TODO: Add support for other kinds of data tracks later
					tracks.push(segmentTrack(
						cm,
						d3data,
						visualizations[t.vis](t.vis_config),
						{
							title: t.title,
							peeker: tp,
							samples: ensureArray(t.samples),
							sampleLabels: ensureArray(t.sample_labels),
							barSize: t.subtrack_size ? t.subtrack_size : 30,
							barPadding: t.subtrack_padding ? t.subtrack_padding : 0.25,
							compact: t.compact ? true : false
						})
					);
				});
				
				tracks.push(axisTrack(cm));

				function buildExplorer() {
					// Clear previous
					innerExplorerDiv.html("");

					expl = explorer(innerExplorerDiv, cm, tracks, {
						transform: expl != null ? expl.currentTransform() : null
					});
				}
		
				if (x.annotations && x.annotations.refseq_genes_compressed) {
					// TODO: Show something even if annotations could not be loaded
					getOrFetchAnnotation(x.annotations.refseq_genes_compressed, cm, genes => {
						tracks.push(geneTrack(genes, { peeker: tp }));
						buildExplorer();
					});

				} else {
					buildExplorer();
				}

			},

			resize: function(width, height) {
				// TODO: Some optimizations. It is unnecessary to rebuild the whole dom subtree.
				if (expl != null) {
					expl.rebuild();
				} else {
					console.log("expl is null or something...");
				}
			}
		};
	}
});
