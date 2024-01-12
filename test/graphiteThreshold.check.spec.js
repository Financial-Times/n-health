'use strict';

const expect = require('chai').expect;
const fixture = require('./fixtures/config/graphiteThresholdFixture').checks[0];
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const sinon = require('sinon');

function getCheckConfig(conf) {
	return Object.assign({}, fixture, conf || {});
}

const mockLogger = {
	error: function () {},
	info: function () {},
	debug: function () {}
};

let mockFetch;
let Check;

// Mocks a pair of calls to graphite for sample and baseline data
function mockGraphite(results) {
	mockFetch = sinon.stub().returns(
		Promise.resolve({
			status: 200,
			ok: true,
			json: () => Promise.resolve(results)
		})
	);

	Check = proxyquire('../src/checks/graphiteThreshold.check', {
		'@dotcom-reliability-kit/logger': mockLogger,
		'node-fetch': mockFetch
	});
}

describe('Graphite Threshold Check', function () {
	let check;

	afterEach(function () {
		check.stop();
	});

	context('Upper threshold enforced', function () {
		it('Should be healthy if all datapoints below upper threshold', function (done) {
			mockGraphite([
				{
					datapoints: [
						[7, 1234567890],
						[8, 1234567891]
					]
				},
				{
					datapoints: [
						[9, 1234567892],
						[10, 1234567893]
					]
				}
			]);
			check = new Check(
				getCheckConfig({
					threshold: 11
				})
			);
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

		it('Should be healthy if any datapoints are equal to upper threshold', function (done) {
			mockGraphite([
				{
					datapoints: [
						[8, 1234567890],
						[9, 1234567891]
					]
				},
				{
					datapoints: [
						[10, 1234567892],
						[11, 1234567893]
					]
				}
			]);
			check = new Check(
				getCheckConfig({
					threshold: 11
				})
			);
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

		it('should be unhealthy if any datapoints are above upper threshold', (done) => {
			mockGraphite([
				{
					datapoints: [
						[8, 1234567890],
						[9, 1234567891]
					]
				},
				{
					datapoints: [
						[10, 1234567892],
						[12, 1234567893]
					]
				}
			]);
			check = new Check(
				getCheckConfig({
					threshold: 11
				})
			);
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.false;
				done();
			});
		});
	});

	context('Lower threshold enforced', function () {
		it('Should be healthy if all datapoints are above lower threshold', function (done) {
			mockGraphite([
				{
					datapoints: [
						[12, 1234567890],
						[13, 1234567891]
					]
				},
				{
					datapoints: [
						[14, 1234567892],
						[15, 1234567893]
					]
				}
			]);
			check = new Check(
				getCheckConfig({
					threshold: 11,
					direction: 'below'
				})
			);
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

		it('Should be healthy if any datapoints are equal to lower threshold', function (done) {
			mockGraphite([
				{
					datapoints: [
						[11, 1234567890],
						[12, 1234567891]
					]
				},
				{
					datapoints: [
						[13, 1234567892],
						[14, 1234567893]
					]
				}
			]);
			check = new Check(
				getCheckConfig({
					threshold: 11,
					direction: 'below'
				})
			);
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

		it('should be unhealthy if any datapoints are below lower threshold', (done) => {
			mockGraphite([
				{
					target: 'next.heroku.cpu.min',
					datapoints: [
						[10, 1234567890],
						[12, 1234567891]
					]
				},
				{
					target: 'next.heroku.disk.min',
					datapoints: [
						[10, 1234567890],
						[12, 1234567891]
					]
				},
				{
					target: 'next.heroku.memory.min',
					datapoints: [
						[13, 1234567892],
						[14, 1234567893]
					]
				}
			]);
			check = new Check(
				getCheckConfig({
					threshold: 11,
					direction: 'below'
				})
			);
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.false;
				expect(check.getStatus().checkOutput).to.equal(
					'In the last 10min, the following metric(s) have moved below the threshold value of 11: next.heroku.cpu.min next.heroku.disk.min'
				);
				done();
			});
		});

		it('should be healthy if any non-null datapoint is below lower threshold', (done) => {
			mockGraphite([
				{
					target:
						'next.heroku.es-interface.pushUpdater_1_EU.push_event_received',
					datapoints: [
						[2, 1531921740],
						[3, 1531921800],
						[2, 1531921860],
						[null, 1531921920],
						[null, 1531921980]
					]
				}
			]);
			check = new Check(
				getCheckConfig({
					threshold: 1,
					direction: 'below',
					samplePeriod: '5min'
				})
			);
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.true;
				expect(check.getStatus().checkOutput).to.equal(
					'No threshold error detected in graphite data for next.metric.200.'
				);
				done();
			});
		});
	});

	context('It handles summarize(sumSeries)', function () {
		it('Should be healthy if sum above threshold', function (done) {
			mockGraphite([
				{
					datapoints: [
						[null, 1635125640],
						[null, 1635129240],
						[1, 1635132840],
						[1, 1635136440],
						[null, 1635140040],
						[3, 1635143640]
					],
					target: 'summarize(sumSeries)'
				}
			]);
			check = new Check(
				getCheckConfig({
					threshold: 1,
					direction: 'below'
				})
			);
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

		it('Should be healthy if sum below threshold', function (done) {
			mockGraphite([
				{
					datapoints: [
						[null, 1635125640],
						[null, 1635129240],
						[1, 1635132840],
						[1, 1635136440],
						[null, 1635140040],
						[3, 1635143640]
					],
					target: 'summarize(sumSeries)'
				}
			]);
			check = new Check(
				getCheckConfig({
					threshold: 8
				})
			);
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

		it('Should be unhealthy if sum below threshold', function (done) {
			mockGraphite([
				{
					datapoints: [
						[null, 1635125640],
						[null, 1635129240],
						[1, 1635132840],
						[1, 1635136440],
						[null, 1635140040],
						[3, 1635143640]
					],
					target: 'summarize(sumSeries)'
				}
			]);
			check = new Check(
				getCheckConfig({
					threshold: 6,
					direction: 'below'
				})
			);
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.false;
				done();
			});
		});

		it('Should be unhealthy if sum above threshold', function (done) {
			mockGraphite([
				{
					datapoints: [
						[null, 1635125640],
						[null, 1635129240],
						[1, 1635132840],
						[1, 1635136440],
						[null, 1635140040],
						[3, 1635143640]
					],
					target: 'summarize(sumSeries)'
				}
			]);
			check = new Check(
				getCheckConfig({
					threshold: 4
				})
			);
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.false;
				done();
			});
		});
	});

	context('It handles asPercent', function () {
		it('Should be healthy if above threshold', function (done) {
			mockGraphite([
				{
					datapoints: [[8, 1635125640]],
					target: `asPercent(summarize(sumSeries(failure.count), '10min', 'sum', true), summarize(sumSeries(success.count), '10min', 'sum', true))`
				}
			]);

			check = new Check(
				getCheckConfig({
					threshold: 1,
					direction: 'below'
				})
			);
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

		it('Should be healthy if below threshold', function (done) {
			mockGraphite([
				{
					datapoints: [[null, 1635125640]],
					target: `asPercent(summarize(sumSeries(failure.count), '10min', 'sum', true), summarize(sumSeries(success.count), '10min', 'sum', true))`
				}
			]);
			check = new Check(
				getCheckConfig({
					threshold: 1
				})
			);
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

		it('Should be unhealthy if above threshold', function (done) {
			mockGraphite([
				{
					datapoints: [[8, 1635125640]],
					target: `asPercent(summarize(sumSeries(failure.count), '10min', 'sum', true),summarize(sumSeries(success.count), '10min', 'sum', true))`
				}
			]);
			check = new Check(
				getCheckConfig({
					threshold: 5
				})
			);
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.false;
				done();
			});
		});

		it('Should be unhealthy if below threshold', function (done) {
			mockGraphite([
				{
					datapoints: [[null, 1635125640]],
					target: `asPercent(summarize(sumSeries(failure.count), '10min', 'sum', true), summarize(sumSeries(success.count), '10min', 'sum', true))`
				}
			]);
			check = new Check(
				getCheckConfig({
					threshold: 4,
					direction: 'below'
				})
			);
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.false;
				done();
			});
		});
	});

	context('It handles divideSeries', function () {
		it('Should be healthy if above threshold', function (done) {
			mockGraphite([
				{
					datapoints: [[8, 1635125640]],
					target: `divideSeries(sumSeries(error.count), sumSeries(status.*.count))`
				}
			]);

			check = new Check(
				getCheckConfig({
					threshold: 1,
					direction: 'below'
				})
			);
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

		it('Should be healthy if below threshold', function (done) {
			mockGraphite([
				{
					datapoints: [[null, 1635125640]],
					target: `divideSeries(sumSeries(error.count), sumSeries(status.*.count))`
				}
			]);
			check = new Check(
				getCheckConfig({
					threshold: 1
				})
			);
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.true;
				done();
			});
		});

		it('Should be unhealthy if above threshold', function (done) {
			mockGraphite([
				{
					datapoints: [[8, 1635125640]],
					target: `divideSeries(sumSeries(error.count),sumSeries(status.*.count))`
				}
			]);
			check = new Check(
				getCheckConfig({
					threshold: 5
				})
			);
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.false;
				done();
			});
		});

		it('Should be unhealthy if below threshold', function (done) {
			mockGraphite([
				{
					datapoints: [[null, 1635125640]],
					target: `divideSeries(sumSeries(error.count), sumSeries(status.*.count))`
				}
			]);
			check = new Check(
				getCheckConfig({
					threshold: 4,
					direction: 'below'
				})
			);
			check.start();
			setTimeout(() => {
				expect(check.getStatus().ok).to.be.false;
				done();
			});
		});
	});

	it('Should be possible to configure sample period', function (done) {
		mockGraphite([{ datapoints: [] }]);
		check = new Check(
			getCheckConfig({
				samplePeriod: '24h'
			})
		);
		check.start();
		setTimeout(() => {
			expect(mockFetch.firstCall.args[0]).to.contain(
				'from=-24h&target=next.metric.200'
			);
			done();
		});
	});
});
