'use strict';
const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('Memory Usage Check', function(){

	let config = require('./fixtures/config/memcheckFixture').checks[0];

	const wait = ms => new Promise(r => setTimeout(r, ms));

	let bronzeAppsListFixture = new Map([
		['ft-next-test-app', 'bronze'],
		['ft-next-platinum-app', 'bronze']
	]);

	let platinumAppsListFixture = new Map([
		['ft-next-test-app', 'bronze'],
		['ft-next-platinum-app', 'platinum']
	]);


	let mockServiceRegistryAdaptor;

	let mockHerokuAdaptor;

	function setup(appsListFixture, count){
		mockServiceRegistryAdaptor = {
			start : sinon.stub().returns(Promise.resolve(null)),
			getData : sinon.stub().returns(appsListFixture)
		};
		mockHerokuAdaptor = {
			getR14Count: sinon.stub().returns(Promise.resolve(count || 0))
		};

		let MemCheck = proxyquire(
			'../src/checks/memory.check',
			{
				'../lib/serviceRegistryAdaptor':mockServiceRegistryAdaptor,
				'../lib/herokuAdaptor':mockHerokuAdaptor
			}
		);

		return new MemCheck(config);
	}

	it('Should get a list of apps from the service registry', () => {
		let memcheck = setup(bronzeAppsListFixture, 0);
		memcheck.start();
		return wait(500)
			.then(() => {
				sinon.assert.called(mockServiceRegistryAdaptor.start);
				sinon.assert.called(mockServiceRegistryAdaptor.getData);
			});
	});

	it('Should make an api call for each app on the given interval', () => {
		let memcheck = setup(bronzeAppsListFixture, 0);
		memcheck.start();
		return wait(500)
			.then(() => {
				expect(mockHerokuAdaptor.getR14Count.callCount).to.equal(bronzeAppsListFixture.size);
				expect(bronzeAppsListFixture.has(mockHerokuAdaptor.getR14Count.firstCall.args[0])).to.be.true;
			});
	});

	it('Should fail if an app had has R14 errors in the time period', () => {
		let memcheck = setup(bronzeAppsListFixture, 5);
		memcheck.start();
		return wait(500)
			.then(() => {
				let status = memcheck.getStatus();
				expect(status.ok).to.be.false;
				for(let app of bronzeAppsListFixture.keys()){
					expect(status.checkOutput).to.contain(app);
				}
			});
	});

	it('Should fail with a severity of 3 for bronze apps', () => {
		let memcheck = setup(bronzeAppsListFixture, 5);
		memcheck.start();
		return wait(500)
			.then(() => {
				let status = memcheck.getStatus();
				expect(status.severity).to.equal(3);
			});
	});

	it('Should fail with a severity of 2 for platinum apps', () => {
		let memcheck = setup(platinumAppsListFixture, 5);
		memcheck.start();
		return wait(500)
			.then(() => {
				let status = memcheck.getStatus();
				expect(status.severity).to.equal(2);
			});
	});
});
