'use strict';
const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('Heroku Adaptor', function(){

	const wait = ms => new Promise(r => setTimeout(r, ms));
	let adaptor;

	describe('Itegration', () => {

		before(() => {
			adaptor = require('../src/lib/herokuAdaptor');
		});

		it('Should be able to get data from the metrics api', () => {
			return adaptor.getErrorMetrics('ft-next-article-eu', '10m')
				.then(metrics => {
					expect(metrics).to.exist;
					expect(metrics).to.have.property('start_time');
					expect(metrics).to.have.property('end_time');
					expect(metrics).to.have.property('step');
					expect(metrics).to.have.property('data');
				})
		});

	});

	describe('Unit tests', () => {

		let adaptor;
		let fixture = require('./fixtures/herokuMetricsApiResponse.json');
		let mockResponse = {status:200, ok:true, json:() => fixture};
		let mockFetch = sinon.stub().returns(Promise.resolve(mockResponse));

		before(() => {
			adaptor = proxyquire('../src/lib/herokuAdaptor', {'node-fetch':mockFetch});
		});


		it('Should return the number of R14 errors within the given timeframe', () => {
			return adaptor.getR14Count('ft-next-article-eu', '10m')
				.then(count => {
					expect(count).to.exist;
					expect(count).to.equal(5953);
				})
		});

	});
});
