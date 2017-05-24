/*
 * ATTENTION: This source is probably broken.
 */

/**
 * genome-explorer
 *
 * Copyright © 2016 Kari Lavikka. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */


import { get } from "./modules/ajax";
import explorer from './modules/explorer';
import chromMapper from "./modules/chromMapper";
import * as d3 from "d3";

import cytobandTrack, { parseCytobandTsv, extractChromSizes } from "./modules/cytobandTrack";
import axisTrack from "./modules/axisTrack";
import geneTrack, { parseCompressedRefseqGeneTsv } from "./modules/geneTrack";
import dataTrack from "./modules/dataTrack";

import * as visualizations from "./modules/visualizations";

import tablePeeker from "./modules/tablePeeker";

const cytobandUrl = "data/cytoband.hg19.txt";
const metUrl = "data/combined2.csv";
const cnvUrl = "data/transformed2.csv";
const geneUrl = "data/refSeq_genes.hg19.compressed.txt";


// http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
function getParameterByName(name, url) {
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}


function parseMetItem(cm, d) {
	d.start = +d.start;
	d.end = +d.end;
	d.D_met = +d.D_met;
	d.R_met = +d.R_met;
	d.D_expr = +d.D_expr;
	d.R_expr = +d.R_expr;

	const chromStart = cm.chromStart(d.chrom);

	return {
		data: d,
		category: d.case,
		// Precalc for optimization
		linearStart: chromStart + d.start,
		linearEnd: chromStart + d.end
	}
}

function parseCnvItem(cm, d) {
	d.start = +d.start;
	d.end = +d.end;
	d.segMean = +d.segMean
	d.bafMean = +d.bafMean

	const chromStart = cm.chromStart(d.chrom);

	return {
		data: d,
		category: d.case,
		// Precalc for optimization
		linearStart: chromStart + d.start,
		linearEnd: chromStart + d.end
	}
}

function loadReady(results) {
	const [cytobandTsv, geneTsv, metTsv, cnvTsv] = results;

	const cytobands = parseCytobandTsv(cytobandTsv);

	const cm = chromMapper(extractChromSizes(cytobands));

	const genes = parseCompressedRefseqGeneTsv(cm, geneTsv);

	const metData = d3.tsvParse(metTsv).map(d => parseMetItem(cm, d));
	const cnvData = d3.tsvParse(cnvTsv).map(d => parseCnvItem(cm, d));

	const tp = tablePeeker(d3.select("#table"));

	const met = visualizations.simple({
		color: "direction"
	});

	const cnv = visualizations.cnvAndBaf({
		cnv: "segMean",
		baf: "bafMean"
	});

	const cnvDomain = ["32", "RR6", "254", "273", "210", "278", "4"]
		.reduce((list, x) => list.concat(["D" + x, "R" + x]), []);

	const tracks = [
		cytobandTrack(cm, cytobands, tp),
//		dataTrack(cm, data, visualizations[getParameterByName("aes")], "Methylation", tp),
		dataTrack(cm, metData, met, { title: "Diff. met.", peeker: tp, domain: ["s32", "RR6", "s254", "s4"] }),
		dataTrack(cm, cnvData, cnv, { title: "CNV & LOH", peeker: tp, domain: cnvDomain }),
		axisTrack(cm),
		geneTrack(genes, tp),
	];

	const container = d3.select("#chart-wrapper");

	const exp = explorer(container, cm, tracks);
}

Promise.all([cytobandUrl, geneUrl, metUrl, cnvUrl].map(url => get(url)))
	.then(loadReady);

document.getElementById("aes-choices").style.display = "none";

document.addEventListener("mousemove", e => {
	const table = document.querySelector("table.peeker");
	if (e.clientX < window.innerWidth / 2) {
		table.classList.add("right");
	} else {
		table.classList.remove("right");
	}
});

/*

if (getParameterByName("aes")) {
	document.getElementById("aes-choices").style.display = "none";

} else {
	document.getElementById("explorer").style.display = "none";
}
*/

//global.explorer = Explorer();
