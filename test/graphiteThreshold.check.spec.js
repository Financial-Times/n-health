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
		json : () => Promise.resolve([{datapoints: results}])
	}));

	Check = proxyquire('../src/checks/graphiteThreshold.check', {'node-fetch':mockFetch});
}

describe('Graphite Threshold Check', function(){

	let check;

	afterEach(function(){
		check.stop();
	});

	context('Upper threshold enforced', function () {

		it('Should be healthy if all datapoints below upper threshold', function (done) {
			mockGraphite([[9, 1234567890], [10, 1234567891]]);
			check = new Check(getCheckConfig({
				threshold: 11
			}));
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

		it('Should be healthy if any datapoints are equal to upper threshold', function (done) {
			mockGraphite([[10, 1234567890], [11, 1234567891]]);
			check = new Check(getCheckConfig({
				threshold: 11
			}));
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

		it('should be unhealthy if any datapoints are above upper threshold', done => {
			mockGraphite([[10, 1234567890], [12, 1234567891]]);
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

		it('Should be healthy if all datapoints are above lower threshold', function (done) {
			mockGraphite([[12, 1234567890], [13, 1234567891]]);
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

		it('Should be healthy if any datapoints are equal to lower threshold', function (done) {
			mockGraphite([[11, 1234567890], [12, 1234567891]]);
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

		it('should be unhealthy if any datapoints are below lower threshold', done => {
			mockGraphite([[10, 1234567890], [12, 1234567891]]);
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
		mockGraphite([[0, 1234567890]]);
		check = new Check(getCheckConfig({
			samplePeriod: '24h'
		}));
		check.start();
		setTimeout(() => {
			expect(mockFetch.firstCall.args[0]).to.contain('from=-24h&target=metric.200');
			done();
		});
	});

});
