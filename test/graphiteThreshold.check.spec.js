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
		json : () => Promise.resolve([{datapoints: [[results.shift()]]}])
	}));

	Check = proxyquire('../src/checks/graphiteThreshold.check', {'node-fetch':mockFetch});
}

describe('Graphite Threshold Check', function(){

	let check;

	afterEach(function(){
		check.stop();
	});

	context('Upper threshold enforced', function () {

		it('Should be healthy if below upper threshold', function (done) {
			mockGraphite([10]);
			check = new Check(getCheckConfig({
				threshold: 11
			}));
			check.start();
			setTimeout(() => {
				expect(mockFetch.firstCall.args[0]).to.contain('from=-10min&target=maxSeries(metric.200)');
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

		it('Should be healthy if equal to upper threshold', function (done) {
			mockGraphite([11]);
			check = new Check(getCheckConfig({
				threshold: 11
			}));
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

		it('should be unhealty if above upper threshold', done => {
			mockGraphite([12]);
			check = new Check(getCheckConfig({
				threshold: 11
			}));
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.false;
				done();
			});
		});

	});

	context('Lower threshold enforced', function () {

		it('Should be healthy if above lower threshold', function (done) {
			mockGraphite([12]);
			check = new Check(getCheckConfig({
				threshold: 11,
				direction: 'below'
			}));
			check.start();
			setTimeout(() => {
				expect(mockFetch.firstCall.args[0]).to.contain('from=-10min&target=minSeries(metric.200)');
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

		it('Should be healthy if equal to lower threshold', function (done) {
			mockGraphite([11]);
			check = new Check(getCheckConfig({
				threshold: 11,
				direction: 'below'
			}));
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

		it('should be unhealty if below lower threshold', done => {
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
		});

	});

	it('Should be possible to configure sample period', function(done){
		mockGraphite([0]);
		check = new Check(getCheckConfig({
			samplePeriod: '24h'
		}));
		check.start();
		setTimeout(() => {
			expect(mockFetch.firstCall.args[0]).to.contain('from=-24h&target=maxSeries(metric.200)');
			done();
		});
	});

});
