L.Edit = L.Edit || {};

L.Edit.Rectangle = L.Edit.Path.extend({

// TODO: keep rectangular after rotate !!

});

L.Rectangle.addInitHook(function () {
	if (L.Edit.Rectangle) {
		this.editing = new L.Edit.Rectangle(this);

		if (this.options.editable) {
			this.editing.enable();
		}
	}
});
