describe("Control.Draw", function(){
	var map, control, container;

	beforeEach(function(){
		map = L.map(document.createElement('div'));
		control = new L.Control.Draw({

		}).addTo(map);
		container = control.getContainer();
	});

	it("exists", function() {
		expect(container.innerHTML).to.be.ok();
	});
});
