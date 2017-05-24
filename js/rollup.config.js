// https://code.lengstorf.com/learn-rollup-js/
//
import babel from 'rollup-plugin-babel';
import json from "rollup-plugin-json";
import nodeResolve from "rollup-plugin-node-resolve";
import uglify from 'rollup-plugin-uglify';
import globals from "rollup-plugin-node-globals"

export default {
//		entry: 'src/scripts/main.js',
//		dest: 'build/js/main.min.js',
		entry: 'src/GenomeExplorer.js',
		dest: '../inst/htmlwidgets/GenomeExplorer.js',
		format: 'iife',
		sourceMap: true,
		sourceMapFile: 'build/js/main.js.map',
		plugins: [
				babel({ exclude: 'node_modules/**', }),
				nodeResolve({jsnext: true}),
				json(),
				globals(),
//				uglify(),
		],
		//external: [ "d3" ],
		globals: {
			// https://github.com/rollup/rollup/issues/59
			//d3: "d3",
		}
};
