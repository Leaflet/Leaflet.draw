describe("Draw.Feature", function () {
	it("initHook", function () {
		var hook = sinon.spy();
		L.Draw.Feature.addInitHook(hook);
		var map = L.map(document.createElement('div'));
		var marker = new L.Draw.Marker(map);
		expect(hook.calledOnce).to.eql(true);
	});
});
