'use strict';
const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();


describe('Service Registry Adaptor', function(){

	function wait(ms){
		return new Promise(r => setInterval(r, ms));
	}

	let adaptor;
	let serviceRegistryFixture = require('./fixtures/serviceRegistryFixture.json');
	let mockResponse = {status:200, ok:true, json:() => serviceRegistryFixture};
	let mockFetch;

	beforeEach(() => {
		mockFetch = sinon.stub().returns(Promise.resolve(mockResponse));
		adaptor = proxyquire('../src/lib/serviceRegistryAdaptor', {'node-fetch':mockFetch});
	});

	afterEach(() => {
		//mockFetch.restore();
	});

	it('Should call the service registry', () => {
		return adaptor.start(1000)
			.then(() => {
				sinon.assert.called(mockFetch);
				sinon.assert.calledWith(mockFetch, 'http://next-registry.ft.com/');
			})
	});

	it('Should be able to parse out the nodes and service tiers', () => {
		return adaptor.start(1000)
			.then(() => {
				let data = adaptor.getData();
				expect(data.has('ft-next-article-eu')).to.be.true;
			})
	});

	it('Should poll the registry using the given interval', () => {
		return adaptor.start(500)
			.then(() => wait(1000))
			.then(() => {
				sinon.assert.calledTwice(mockFetch);
			})
	});
});

