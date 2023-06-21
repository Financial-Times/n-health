'use strict';
const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();	

describe('Graphite Working Check', function(){
	const fixtures = require('./fixtures/config/graphiteWorkingFixture');
	const fixtureBasic = fixtures.checks[0];
	const fixtureWeekend = fixtures.checks[1];
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

	const recentlyBadResponse = [
		{
			"target": "summarize(next.fastly.133g5BGAc00Hv4v8t0dMry.anzac.requests, \"1h\", \"sum\", true)",
			"datapoints": [
				[ null, 1459333140 ],
				[ 1, 1459333200 ],
				[ 1, 1459333260 ],
				[ null, 1459333320 ],
				[ null, 1459333380 ],
				[ null, 1459333440 ],
			]
		}
	];

    const completelyBadResponse = [
        {
            "target": "summarize(next.fastly.133g5BGAc00Hv4v8t0dMry.anzac.requests, \"1h\", \"sum\", true)",
            "datapoints": [
                [ null, 1459333140 ],
                [ null, 1459333200 ],
                [ null, 1459333260 ],
                [ null, 1459333320 ],
                [ null, 1459333380 ],
                [ null, 1459333440 ],
            ]
        }
    ];

	function waitFor(time){
		return new Promise(resolve => setTimeout(resolve, time));
	}

	function setup(response,fixture = fixtureBasic){
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
			expect(url).to.contain(fixtureBasic.metric);
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

	it('Should fail if there is has been 2 or more minutes of missing data', () => {
		setup(recentlyBadResponse);
		check.start();
		return waitFor(10).then(() => {
			expect(check.getStatus().ok).to.be.false;
			expect(check.getStatus().checkOutput).to.equal('summarize(next.fastly.133g5BGAc00Hv4v8t0dMry.anzac.requests, "1h", "sum", true) has been null for 3 minutes.');
		});
	});

    it('Should fail if there is no data', () => {
        setup(completelyBadResponse);
        check.start();
        return waitFor(10).then(() => {
            expect(check.getStatus().ok).to.be.false;
            expect(check.getStatus().checkOutput).to.equal('summarize(next.fastly.133g5BGAc00Hv4v8t0dMry.anzac.requests, "1h", "sum", true) has been null for Infinity minutes.');
        });
    });
	
	describe("Applying overrides", () => {
	
		it('Should override parameters while weekend',async () => {
			setup(goodResponse,fixtureWeekend)
			//mock to be weekend
			check.isWeekend = sinon.stub().returns(() => true);
			check.start();
			await waitFor(10);
			sinon.assert.called(check.isWeekend );
			sinon.assert.called(mockFetch);
			expect(check.getStatus().checkOutput).to.equal('next.fastly.f8585BOxnGQDMbnkJoM1e.weekend.requests has data');
			expect(check.time).to.equal(fixtureWeekend.override.weekend.time);
			expect(check.metric).to.equal(fixtureWeekend.override.weekend.metric)
			expect(check.initialState.metric).to.equal(fixtureWeekend.metric);
			expect(check.initialState.time).to.equal(fixtureWeekend.time)
			expect(check.getStatus().ok).to.be.true;
			check.isWeekend = sinon.stub().returns(() => false);

			await waitFor(10);
			sinon.assert.calledTwice(mockFetch);
			sinon.assert.called(check.isWeekend );
			expect(check.getStatus().checkOutput).to.equal('next.fastly.f8585BOxnGQDMbnkJoM1e.all.requests has data');
			expect(check.time).to.equal(fixtureWeekend.time);
			expect(check.metric).to.equal(fixtureWeekend.metric)
			expect(check.initialState.metric).to.equal(fixtureWeekend.metric);
			expect(check.initialState.time).to.equal(fixtureWeekend.time)
			expect(check.getStatus().ok).to.be.true;
		})
	})
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
