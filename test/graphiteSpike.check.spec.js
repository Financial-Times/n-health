'use strict';

const expect = require('chai').expect;
const fetchMock = require('fetch-mock');
const Check = require('../src/checks/').graphiteSpike;
const fixture = require('./fixtures/config/graphiteSpikeFixture').checks[0];

function getCheckConfig (conf) {
	return Object.assign({}, fixture, conf || {});
}

// Mocks a pair of calls to graphite for sample and baseline data
function mockGraphite (results) {

	fetchMock.mock({
		routes: [
			{
				name: 'graphite',
				matcher: '^https://www.hostedgraphite.com/',
				response: () => {
					return [
						{datapoints: [[results.shift()]]}
					];
				}
			}
		]
	});
}

describe('Graphite Spike Check', function(){

	let check;

	afterEach(function(){
		check.stop();
		fetchMock.restore();
	});


	describe('service config', function () {
			it('Should default to the next hosted graphite', function (done) {

				mockGraphite([2, 1]);
				check = new Check(getCheckConfig({
					normalize: false
				}));
				check.start();
				setTimeout(() => {
					expect(fetchMock.calls('graphite')[0][0]).to.contain('https://www.hostedgraphite.com/bbaf3ccf/test-graph-key/graphite/render/?_salt=1445340974.799&');
					done();
				});
			});

			it('Should be possible to point to a different hosted graphite instance', function (done) {

				mockGraphite([2, 1]);
				check = new Check(getCheckConfig({
					normalize: false,
					graphiteServiceId: 12345,
					graphiteKey: 'keykeykey',
					graphiteSalt: 'saltysalt'
				}));
				check.start();
				setTimeout(() => {
					expect(fetchMock.calls('graphite')[0][0]).to.contain('https://www.hostedgraphite.com/12345/keykeykey/graphite/render/?_salt=saltysalt&');
					done();
				});
			});

			it('Should be possible to post to graphite hosted on an arbitrary domain', function (done) {

				fetchMock.mock({
					routes: [
						{
							name: 'graphite',
							matcher: '^https://graphite.effitty.com/',
							response: () => {
								return [
									{datapoints: [[1]]}
								];
							}
						}
					]
				});
				check = new Check(getCheckConfig({
					normalize: false,
					graphiteBaseUrl: 'https://graphite.effitty.com/?bloop&blip'
				}));
				check.start();
				setTimeout(() => {
					expect(fetchMock.calls('graphite')[0][0]).to.contain('https://graphite.effitty.com/?bloop&blip');
					done();
				});
			});
	})

	it('Should be able to report a successful check of absolute values', function (done) {

		mockGraphite([2, 1]);
		check = new Check(getCheckConfig({
			normalize: false
		}));
		check.start();
		setTimeout(() => {
			expect(fetchMock.calls('graphite')[0][0]).to.contain('from=-10min&format=json&target=summarize(sumSeries(metric.200),"10min","sum",true)');
			expect(fetchMock.calls('graphite')[1][0]).to.contain('from=-7d&format=json&target=summarize(sumSeries(metric.200),"7d","sum",true)');
			expect(check.getStatus().ok).to.be.true;
			done();
		});
	});

	it('Should be able to report a successful check of percentage values', function(done){

		mockGraphite([2, 1]);
		check = new Check(getCheckConfig({
			divisor: 'metric.*'
		}));
		check.start();
		setTimeout(() => {
			expect(fetchMock.calls('graphite')[0][0]).to.contain('from=-10min&format=json&target=divideSeries(summarize(sumSeries(metric.200),"10min","sum",true),summarize(sumSeries(metric.*),"10min","sum",true))');
			expect(fetchMock.calls('graphite')[1][0]).to.contain('from=-7d&format=json&target=divideSeries(summarize(sumSeries(metric.200),"7d","sum",true),summarize(sumSeries(metric.*),"7d","sum",true))');
			expect(check.getStatus().ok).to.be.true;
			done();
		});
	});

	it('Should be possible to detect spikes', function(done){
		mockGraphite([4, 1]);
		check = new Check(getCheckConfig({
			normalize: false
		}));
		check.start();
		setTimeout(() => {
			expect(check.getStatus().ok).to.be.false;
			done();
		});
	});

	it('Should be possible to detect negative non-spikes', function(done){
		mockGraphite([1, 2]);
		check = new Check(getCheckConfig({
			direction: 'down',
			normalize: false
		}));
		check.start();
		setTimeout(() => {
			expect(check.getStatus().ok).to.be.true;
			done();
		});
	});

	it('Should be possible to detect negative spikes', function(done){
		mockGraphite([1, 4]);
		check = new Check(getCheckConfig({
			direction: 'down',
			normalize: false
		}));
		check.start();
		setTimeout(() => {
			expect(check.getStatus().ok).to.be.false;
			done();
		});
	});

	it('Should be possible to configure sample and baseline periods', function(done){
		mockGraphite([2, 1]);
		check = new Check(getCheckConfig({
			samplePeriod: '24h',
			baselinePeriod: '2d',
			divisor: 'metric.*',
			normalize: false
		}));
		check.start();
		setTimeout(() => {
			expect(fetchMock.calls('graphite')[0][0]).to.contain('from=-24h&format=json&target=divideSeries(summarize(sumSeries(metric.200),"24h","sum",true),summarize(sumSeries(metric.*),"24h","sum",true))');
			expect(fetchMock.calls('graphite')[1][0]).to.contain('from=-2d&format=json&target=divideSeries(summarize(sumSeries(metric.200),"2d","sum",true),summarize(sumSeries(metric.*),"2d","sum",true))');
			done();
		});
	});


	it('Should normalize by default when no divisor specified', function(done){
		mockGraphite([0.75, 0.5]);
		check = new Check(getCheckConfig({
			samplePeriod: '1h',
			baselinePeriod: '2h',
			threshold: 2
		}));
		check.start();
		setTimeout(() => {
			// because the 0.75 should get converted to a 3 once normalized
			expect(check.getStatus().ok).to.be.false;
			done();
		});
	});

	it('Should be possible to configure spike threshold', function(done){
		mockGraphite([6, 1]);
		check = new Check(getCheckConfig({
			threshold: 5,
			normalize: false
		}));
		check.start();
		setTimeout(() => {
			expect(check.getStatus().ok).to.be.false;
			done();
		});
	});

	it('Should be possible to configure negative spike threshold', function(done){
		mockGraphite([1, 6]);
		check = new Check(getCheckConfig({
			direction: 'down',
			threshold: 5,
			normalize: false
		}));
		check.start();
		setTimeout(() => {
			expect(check.getStatus().ok).to.be.false;
			done();
		});
	});
});


