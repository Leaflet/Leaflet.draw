describe("L.Edit", function () {
	var map;

	beforeEach(function () {
		map = new L.Map(document.createElement('div')).setView([0, 0], 15);
	});

	describe("L.Edit.Marker", function () {
		var marker;

		beforeEach(function () {
			marker = new L.Marker(new L.LatLng(1, 2)).addTo(map);
			marker.editing.enable();
		});

		it("Is activated correctly when editing.enable() is called.", function () {});
	});

	describe("L.Edit.Circle", function () {
		var circle;

		beforeEach(function () {
			circle = new L.Circle(new L.LatLng(1, 2), 5).addTo(map);
			circle.editing.enable();
		});

		it("Is activated correctly when editing.enable() is called.", function () {});

		it("Moves the circle to the correct latlng", function () {
			var newLatLng = new L.LatLng(3, 5);

			circle.editing._move(newLatLng);
			expect(circle.getLatLng()).to.eql(newLatLng);
		});
	});
});