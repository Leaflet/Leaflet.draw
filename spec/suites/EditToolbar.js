describe("EditToolbar", function () {
	it("Edit.initHook", function () {
		var hook = sinon.spy();
		L.EditToolbar.Edit.addInitHook(hook);
		var map = L.map(document.createElement('div'));
		var toolbar = new L.EditToolbar.Edit(map, { featureGroup: L.featureGroup() });
		expect(hook.calledOnce).to.eql(true);
	});

	it("Delete.initHook", function () {
		var hook = sinon.spy();
		L.EditToolbar.Delete.addInitHook(hook);
		var map = L.map(document.createElement('div'));
		var toolbar = new L.EditToolbar.Delete(map, { featureGroup: L.featureGroup() });
		expect(hook.calledOnce).to.eql(true);
	});
});
