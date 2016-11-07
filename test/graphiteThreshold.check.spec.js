'use strict';

const expect = require('chai').expect;
const fixture = require('./fixtures/config/graphiteThresholdFixture').checks[0];
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
		json : () => Promise.resolve(results ? [{ datapoints: results.map(result => [result]) }] : [])
	}));

	Check = proxyquire('../src/checks/graphiteThreshold.check', {'node-fetch':mockFetch});
}

describe('Graphite Threshold Check', function(){

	let check;

	afterEach(function(){
		check.stop();
	});


	it('Should be healthy if not above threshold', function (done) {
		mockGraphite();
		check = new Check(getCheckConfig({
			threshold: 11
		}));
		check.start();
		setTimeout(() => {
			expect(mockFetch.firstCall.args[0]).to.contain('from=-10min&target=maximumAbove(metric.200,11)');
			expect(check.getStatus().ok).to.be.true;
			done();
		});
	});

	it('should be unhealty if above threshold', done => {
		mockGraphite([12]);
		check = new Check(getCheckConfig({
			threshold: 11
		}));
		check.start();
		setTimeout(() => {
			expect(check.getStatus().ok).to.be.false;
			done();
		});
	})

	it('Should be healthy if not below threshold', function (done) {
		mockGraphite();
		check = new Check(getCheckConfig({
			threshold: 11,
			direction: 'below'
		}));
		check.start();
		setTimeout(() => {
			expect(mockFetch.firstCall.args[0]).to.contain('from=-10min&target=minimumBelow(metric.200,11)');
			expect(check.getStatus().ok).to.be.true;
			done();
		});
	});

	it('should be unhealty if below threshold', done => {
		mockGraphite([10]);
		check = new Check(getCheckConfig({
			threshold: 11,
			direction: 'below'
		}));
		check.start();
		setTimeout(() => {
			expect(check.getStatus().ok).to.be.false;
			done();
		});
	})


	it('Should be possible to configure sample period', function(done){
		mockGraphite();
		check = new Check(getCheckConfig({
			threshold: 11,
			samplePeriod: '24h'
		}));
		check.start();
		setTimeout(() => {
			expect(mockFetch.firstCall.args[0]).to.contain('from=-24h&target=maximumAbove(metric.200,11)');
			done();
		});
	});

});


