'use strict';
const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('Memory Usage Check', function(){


	function wait(ms){
		return Promise.resolve(r => setTimeout(r, ms));
	}
	
	let memcheck;
	let config = require('./fixtures/config/memcheckFixture').checks[0];
	let serviceRegistry = require('./fixtures/serviceRegistryFixture.json');


	let mockFetch = sinon.spy((url) => {
		if(/next-registry\.ft\.com/.test(url)){
			return {
				status:200,
				ok:true,
				json: () => Promise.resolve(serviceRegistry)
			}
		}
	});
	
	before(() => {

		let Memcheck = proxyquire('../src/checks/memory.check', {'node-fetch' : mockFetch});
		memcheck = new Memcheck(config);
	});
	

	it('Should get a list of apps from the service registry', () => {
		memcheck.start();
		return wait(100)
			.then(() => {
				sinon.assert.called(mockFetch);
			})
	});

	it('Should make an api call for each app on the given interval');

	it('Should fail if an app had has R14 errors in the time period');

	it('Should fail with a severity of 3 for bronze apps');

	it('Should fail with a severity of 2 for platinum apps');
});
