import L from 'leaflet';

import DrawUtilities from './Utility';
import Draw from './Draw';

L.Map.mergeOptions({
    drawToolsClass: Draw,
    draw: false,
    drawOptions: {}
});

L.Map.addInitHook(function () {
    this.whenReady(function () {
        if (!this.options.editable) {
            console.error('Leaflet.Draw >= 2.0 requires Leaflet.Editable to function.');
        }
        const leaflet = this;
        const drawInit = function () {
            if (leaflet.options.draw) {
                if (leaflet.options.drawOptions && !(Object.keys(leaflet.options.drawOptions).length === 0)) {
                    const version = leaflet.options.drawOptions.version;
                    if (version <= 2.0 || version === undefined) {
                        // Assuming options given is prior to 2.0 - replace with 2.0 version
                        leaflet.options.drawOptions = DrawUtilities.convertLegacyOptions(leaflet.options.drawOptions);
                    }
                }// eslint-disable-next-line
                leaflet.drawTools = new leaflet.options.drawToolsClass(leaflet, leaflet.options.drawOptions);
            }
        };
        if (!leaflet.editTools) {
            // Wait just long enough for edit tools to initialize
            setTimeout(drawInit, 5);
        } else {
            drawInit();
        }
    });
});
