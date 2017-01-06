'use strict';

const expect = require('chai').expect;
const fixture = require('./fixtures/config/graphiteSpikeFixture').checks[0];
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const sinon = require('sinon');


function getCheckConfig (conf) {
	return Object.assign({}, fixture, conf || {});
}

let mockFetch;
let Check;

// Mocks a pair of calls to graphite for sample and baseline data
function mockGraphite (results) {

	mockFetch = sinon.stub().returns(Promise.resolve({
		status: 200,
		ok: true,
		json : () => Promise.resolve([{datapoints: [[results.shift()]]}])
	}));


	Check = proxyquire('../src/checks/graphiteSpike.check', {'node-fetch':mockFetch});
}

describe('Graphite Spike Check', function(){

	let check;

	afterEach(function(){
		check.stop();
	});


	describe('service config', function () {
			it('Should use the FT graphite', function (done) {

				mockGraphite([2, 1]);
				check = new Check(getCheckConfig({
					normalize: false
				}));
				check.start();
				setTimeout(() => {
					expect(mockFetch.firstCall.args[0]).to.match(/^https:\/\/graphite-api.ft.com\/render\/\?/);
					done();
				});
			});
	});

	it('Should be able to report a successful check of absolute values', function (done) {

		mockGraphite([2, 1]);
		check = new Check(getCheckConfig({
			normalize: false
		}));
		check.start();
		setTimeout(() => {

			expect(mockFetch.firstCall.args[0]).to.contain('from=-10min&format=json&target=summarize(sumSeries(next.metric.200),"10min","sum",true)');
			expect(mockFetch.secondCall.args[0]).to.contain('from=-7d&format=json&target=summarize(sumSeries(next.metric.200),"7d","sum",true)');
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
			expect(mockFetch.firstCall.args[0]).to.contain('from=-10min&format=json&target=divideSeries(summarize(sumSeries(next.metric.200),"10min","sum",true),summarize(sumSeries(metric.*),"10min","sum",true))');
			expect(mockFetch.secondCall.args[0]).to.contain('from=-7d&format=json&target=divideSeries(summarize(sumSeries(next.metric.200),"7d","sum",true),summarize(sumSeries(metric.*),"7d","sum",true))');
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
			expect(mockFetch.firstCall.args[0]).to.contain('from=-24h&format=json&target=divideSeries(summarize(sumSeries(next.metric.200),"24h","sum",true),summarize(sumSeries(metric.*),"24h","sum",true))');
			expect(mockFetch.secondCall.args[0]).to.contain('from=-2d&format=json&target=divideSeries(summarize(sumSeries(next.metric.200),"2d","sum",true),summarize(sumSeries(metric.*),"2d","sum",true))');
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


