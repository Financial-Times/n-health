'use strict';
const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('Memory Usage Check', function(){

	let config = require('./fixtures/config/memcheckFixture').checks[0];

	const wait = ms => new Promise(r => setTimeout(r, ms));

	let mockServiceRegistryAdaptor = {
		start : sinon.spy(),
		getData : sinon.stub.returns(new Map([
			['ft-next-test-app', 'bronze'],
			['ft-next-platinum-app', 'platinum']
		]))
	};

	function setup(count){
		let mockHerokuAdaptor = {
			getR14Count: sinon.stub().returns(count || 0);
		}

		let MemCheck = proxyquire(
			'../src/checks/memory.check',
			{
				'../lib/serviceRegistryAdaptor':mockServiceRegistryAdaptor,
				'../lib/herokuAdaptor':mockHerokuAdaptor
			}
		);

		return new MemCheck(config);
	}

	it.only('Should get a list of apps from the service registry', () => {
		let memcheck = setup(0);
		memcheck.start();
		return wait(1000)
			.then(() => {
				sinon.assert.called(mockServiceRegistryAdaptor.start);
				sinon.assert.called(mockServiceRegistryAdaptor.getData);
			});
	});

	it('Should make an api call for each app on the given interval');

	it('Should fail if an app had has R14 errors in the time period');

	it('Should fail with a severity of 3 for bronze apps');

	it('Should fail with a severity of 2 for platinum apps');
});
