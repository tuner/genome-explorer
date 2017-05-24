
import * as d3 from "d3";

export default function(cm) {
	var gXAxis;

	const xAxis = d3.axisBottom()
		.tickValues(cm.linearChromPositions())
		.tickFormat(v => cm.chromLoc(v + 1)[0]); // TODO: Fix +1 kludge

	return {
		height: function() {
			return 30;
		},

		onAddTrack: function(trackGroup) {
			gXAxis = trackGroup.append("g")
				.attr("class", "x axis");
			//.attr("clip-path", "url(#clip)")
			;
		},

		zoomed: function(transform, scaledX) {
			xAxis.scale(scaledX);
			gXAxis.call(xAxis);
		}
	}
}
