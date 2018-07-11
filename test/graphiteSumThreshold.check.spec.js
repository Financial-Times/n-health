'use strict';

const expect = require('chai').expect;
const fixture = require('./fixtures/config/graphiteSumThresholdFixture').checks[0];
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const sinon = require('sinon');

describe('Graphite Sum Threshold Check', function(){

	let check;

	afterEach(function(){
		check.stop();
	});

	context('Upper threshold enforced', function () {

        it('Should be healthy if all datapoints summed are below upper threshold', function (done) {
			const {Check} = mockGraphite([
				{ datapoints: [[1, 1234567890], [2, 1234567891]] },
				{ datapoints: [[3, 1234567892], [4, 1234567893]] }
			]);
			check = new Check(getCheckConfig({
				threshold: 11
			}));
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

		it('Should be healthy if all datapoints summed are equal to upper threshold', function (done) {
			const {Check} = mockGraphite([
				{ datapoints: [[1, 1234567890], [2, 1234567891]] },
				{ datapoints: [[3, 1234567892], [4, 1234567893]] }
			]);
			check = new Check(getCheckConfig({
				threshold: 10
			}));
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

		it('should be unhealthy if all datapoints summed are above upper threshold', done => {
			const {Check} = mockGraphite([
				{ datapoints: [[1, 1234567890], [2, 1234567891]] },
				{ datapoints: [[3, 1234567892], [4, 1234567893]] }
			]);
			check = new Check(getCheckConfig({
				threshold: 9
			}));
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.false;
				done();
			});
		});

	});

	context('Lower threshold enforced', function () {

		it('Should be healthy if all datapoints summed are above lower threshold', function (done) {
			const {Check} = mockGraphite([
				{ datapoints: [[1, 1234567890], [2, 1234567891]] },
				{ datapoints: [[3, 1234567892], [4, 1234567893]] }
			]);
			check = new Check(getCheckConfig({
				threshold: 9,
				direction: 'below'
			}));
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

		it('Should be healthy if all datapoints summed are equal to lower threshold', function (done) {
			const {Check} = mockGraphite([
				{ datapoints: [[1, 1234567890], [2, 1234567891]] },
				{ datapoints: [[3, 1234567892], [4, 1234567893]] }
			]);
			check = new Check(getCheckConfig({
				threshold: 10,
				direction: 'below'
			}));
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

		it('should be unhealthy if all datapoints summed are below lower threshold', done => {
			const {Check} = mockGraphite([
				{ target: 'next.heroku.cpu.min', datapoints: [[1, 1234567890], [3, 1234567891]] },
				{ target: 'next.heroku.disk.min', datapoints: [[2, 1234567890], [4, 1234567891]] }
			]);
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
		const {Check, mockFetch} = mockGraphite([{ datapoints: [] }]);
		check = new Check(getCheckConfig({
			from: '24h'
		}));
		check.start();
		setTimeout(() => {
			expect(mockFetch.firstCall.args[0]).to.contain('from=-24h&target=next.metric.200');
			done();
		});
	});

});

// Mocks a pair of calls to graphite for sample and baseline data
function mockGraphite (results) {
	const mockFetch = sinon.stub().returns(Promise.resolve({
		status: 200,
		ok: true,
		json : () => Promise.resolve(results)
	}));

	return {
        mockFetch,
        Check: proxyquire('../src/checks/graphiteSumThreshold.check', {'node-fetch': mockFetch})
    };
}

// Merge default fixture data with test config
function getCheckConfig (conf) {
	return Object.assign({}, fixture, conf || {});
}