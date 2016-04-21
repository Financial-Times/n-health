'use strict';
const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('Heroku Adaptor', function(){
	
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
