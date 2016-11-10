describe("L.GeometryUtil", function () {
	it("geodesicArea", function () {
		expect(L.GeometryUtil.geodesicArea([
			{ lat: 0,  lng: 0 },
			{ lat: 0,  lng: 10 },
			{ lat: 10, lng: 10 },
			{ lat: 10, lng: 0 },
			{ lat: 0,  lng: 0 }
		])).to.eql(1232921098571.292);
	});

	describe("readableDistance", function () {
		it("metric", function () {
			expect(L.GeometryUtil.readableDistance(1000, true)).to.eql('1000 m');
			expect(L.GeometryUtil.readableDistance(1500, true)).to.eql('1.50 km');
			expect(L.GeometryUtil.readableDistance(1500, 'metric')).to.eql('1.50 km');
		});

		it("imperial", function () {
			expect(L.GeometryUtil.readableDistance(1609.3488537961)).to.eql('1760 yd');
			expect(L.GeometryUtil.readableDistance(1610.3488537961)).to.eql('1.00 miles');
			expect(L.GeometryUtil.readableDistance(1610.3488537961, 'yards')).to.eql('1.00 miles');
		});

		it("imperial feet", function () {
			expect(L.GeometryUtil.readableDistance(1609.3488537961, false, true, false)).to.eql('5280 ft');
			expect(L.GeometryUtil.readableDistance(1610.3488537961, false, true, false)).to.eql('5284 ft');
			expect(L.GeometryUtil.readableDistance(1610.3488537961, 'feet')).to.eql('5284 ft');
		});

		it("nautical", function () {
			expect(L.GeometryUtil.readableDistance(1609.3488537961, false, false, true)).to.eql('0.87 nm');
			expect(L.GeometryUtil.readableDistance(1610.3488537961, false, false, true)).to.eql('0.87 nm');
			expect(L.GeometryUtil.readableDistance(1610.3488537961, 'nauticalMile')).to.eql('0.87 nm');
		});
	});
});
