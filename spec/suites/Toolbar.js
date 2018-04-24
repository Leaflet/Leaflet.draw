describe("Toolbar", function () {
	it("initHook", function () {
		var hook = sinon.spy();
		L.Toolbar.addInitHook(hook);
		var toolbar = new L.Toolbar();
		expect(hook.calledOnce).to.eql(true);
	});
});
