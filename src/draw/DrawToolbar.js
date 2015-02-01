L.DrawToolbar = {};

/*
 * Defaults added to map for convenience.
 */
L.Map.mergeOptions({
    drawControlTooltips: true,
    drawControl: false
});

L.Map.addInitHook(function () {
	if (this.options.drawControl) {
		this.drawControl = new L.DrawToolbar.Control();
		this.addLayer(this.drawControl);
	}
});
