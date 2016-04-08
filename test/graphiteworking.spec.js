'use strict';
const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('Graphite Working Check', function(){

	const fixture = require('./fixtures/config/graphiteWorkingFixture').checks[0];
	
	let GraphiteWorkingCheck;
	let check;
	let mockFetch;

	const goodResponse = [
		{
			"target": "summarize(next.fastly.133g5BGAc00Hv4v8t0dMry.asia.requests, \"1h\", \"sum\", true)",
			"datapoints": [
				[
					202,
					1459333140
				]
			]
		}
	];

	const badResponse = [
		{
			"target": "summarize(next.fastly.133g5BGAc00Hv4v8t0dMry.anzac.requests, \"1h\", \"sum\", true)",
			"datapoints": [
				[
					null,
					1459337340
				]
			]
		}
	];

	function waitFor(time){
		return new Promise(resolve => setTimeout(resolve, time));
	}

	function setup(response){
		mockFetch = sinon.stub().returns(Promise.resolve({
			ok: true,
			json: function(){
				return Promise.resolve(response);
			}
		}));
		
		GraphiteWorkingCheck = proxyquire('../src/checks/graphiteWorking.check.js', {'node-fetch':mockFetch})
		check = new GraphiteWorkingCheck(fixture);
	}
	
	it('Should call graphite using the given key', () => {
		setup(goodResponse);
		check.start();
		return waitFor(10).then(() => {
			sinon.assert.called(mockFetch);
			let url = mockFetch.lastCall.args[0];
			expect(url).to.contain(fixture.key);
			expect(url).to.contain('from=-1hours');
			expect(url).to.contain('format=json');
			expect(url).to.contain('_salt=');
		});
	});
	
	it('Should pass if there is some data for the given key', () => {
		setup(goodResponse);
		check.start();
		return waitFor(10).then(() => {
			expect(check.getStatus().ok).to.be.true;
		});
	});
	
	it('Should fail if there is no data', () => {
		setup(badResponse);
		check.start();
		return waitFor(10).then(() => {
			expect(check.getStatus().ok).to.be.false;
		});
	});

	describe('Integration', function(){

		before(() => {
			GraphiteWorkingCheck = require('../src/checks/graphiteWorking.check');
			check = new GraphiteWorkingCheck(fixture);

		});

		it('Can actually call graphite', () => {
			check.start();
			return waitFor(1000).then(() => {
				console.log(check.getStatus());
				expect(check.getStatus().ok).to.be.true;
			});
		});
	})

});
