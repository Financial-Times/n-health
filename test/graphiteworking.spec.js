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
				[ null, 1459333140 ],
				[ null, 1459333200 ],
				[ 1, 1459333260 ],
				[ 1, 1459333320 ],
				[ null, 1459333380 ],
				[ null, 1459333420 ],
			]
		}
	];

	const badResponse = [
		{
			"target": "summarize(next.fastly.133g5BGAc00Hv4v8t0dMry.anzac.requests, \"1h\", \"sum\", true)",
			"datapoints": [
				[ null, 1459333140 ],
				[ 1, 1459333200 ],
				[ 1, 1459333260 ],
				[ null, 1459333320 ],
				[ null, 1459333380 ],
				[ null, 1459333420 ],
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
			expect(url).to.contain(fixture.metric);
			expect(url).to.contain('format=json');
		});
	});

	it('Should pass if there is some data for the given key', () => {
		setup(goodResponse);
		check.start();
		return waitFor(10).then(() => {
			expect(check.getStatus().checkOutput).to.equal('next.fastly.f8585BOxnGQDMbnkJoM1e.all.requests has data');
			expect(check.getStatus().ok).to.be.true;
		});
	});

	it('Should fail if there is no data', () => {
		setup(badResponse);
		check.start();
		return waitFor(10).then(() => {
			expect(check.getStatus().ok).to.be.false;
			expect(check.getStatus().checkOutput).to.equal('summarize(next.fastly.133g5BGAc00Hv4v8t0dMry.anzac.requests, "1h", "sum", true) has been null for 3 minutes.');
		});
	});

	//todo get the graphite api key into the CI config - doesn't seem possible right now...
	describe.skip('Integration', function(){

		before(() => {
			GraphiteWorkingCheck = require('../src/checks/graphiteWorking.check');
			check = new GraphiteWorkingCheck(fixture);

		});

		it('Can actually call graphite', () => {
			check.start();
			return waitFor(1000).then(() => {
				expect(check.getStatus().ok).to.be.true;
			});
		});
	})

});
