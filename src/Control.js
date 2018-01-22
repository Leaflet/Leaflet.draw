import L from 'leaflet';

L.DrawControl = L.Control.extend({
    options: {
        position: 'topright',
        callback: null,
        handlerType: null,
        html: null,
        tooltipMessages: {}
    },
    tooltip: null,

    onAdd: function () {
        const container = this._container = L.DomUtil.create('div', 'leaflet-control leaflet-bar leaflet-draw-toolbar leaflet-draw-control');
        const linkClass = this.options.handlerType + ' leaflet-draw-' + this.options.handlerType;
        const link = L.DomUtil.create('a', linkClass, container);

        link.href = '#';
        link.title = (this.options.tooltipMessages.create) ? this.options.tooltipMessages.create : '';
        link.innerHTML = this.options.html;

        this.hookEvents(link);
        return container;
    },

    onRemove: function () {
        this.getContainer().off();
    },

    openTooltip: function (tooltip, latlng, options) {
        if (!(tooltip instanceof L.Tooltip)) {
            this.tooltip = new L.Tooltip({
                direction: 'right',
                permanent: true,
                offset: [15, 0]
            });
            this.tooltip.setContent(tooltip);
            L.setOptions(this.tooltip, options);
        }

        if (latlng) {
            this.tooltip.setLatLng(latlng);
        }

        if (this._map.hasLayer(this.tooltip)) {
            return this;
        }

        this._map.openTooltip(this.tooltip, [0, 0]);


        this._map.on('mousemove', this._updateTooltipLocation, this);
        return this;
    },

    closeTooltip: function () {
        this._map.closeTooltip(this.tooltip);
        this._map.off('mousemove', this._updateTooltipLocation, this);
    },

    _updateTooltipLocation: function (e) {
        this.tooltip._setPosition(e.layerPoint);
    },

    hookEvents: function (link) {
        L.DomEvent
            .on(link, 'click', L.DomEvent.stop)
            .on(link, 'click', function () {
                window.LAYER = this.options.callback.call(this._map.editTools);
                this.openTooltip(this.options.tooltipMessages.start);
            }, this);
    }
});

export default L.DrawControl;
