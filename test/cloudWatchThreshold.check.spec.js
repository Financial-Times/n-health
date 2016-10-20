'use strict';

const expect = require('chai').expect;
const configFixture = require('./fixtures/config/cloudWatchThresholdFixture');
const dataFixture = require('./fixtures/cloudWatchThresholdResponse');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const sinon = require('sinon');

function getCheckConfig (conf) {
	return Object.assign({}, configFixture.checks[0], conf || {});
}

const cloudWatchMock = sinon.stub().returns({ promise: () => Promise.resolve(dataFixture) });
const awsMock = {
	CloudWatch: function() {
		this.getMetricStatistics = cloudWatchMock
	}
}

const Check = proxyquire('../src/checks/cloudWatchThreshold.check', {'aws-sdk': awsMock});

describe('CloudWatch Threshold Check', () => {

	let check;

	afterEach(() => {
		cloudWatchMock.reset();
		check.stop();
	});

	it('Should be healthy if not above threshold', done => {
		check = new Check(getCheckConfig({
			threshold: 6000
		}));
		check.start();
		setTimeout(() => {
			expect(check.getStatus().ok).to.be.true;
			done();
		});
	});

	it('should be unhealty if below threshold', done => {
		check = new Check(getCheckConfig({
			threshold: 4000
		}));
		check.start();
		setTimeout(() => {
			expect(check.getStatus().ok).to.be.false;
			done();
		});
	})

	it('Should be healthy if not below threshold', (done) => {
		check = new Check(getCheckConfig({
			threshold: 4000,
			direction: 'below'
		}));
		check.start();
		setTimeout(() => {
			expect(check.getStatus().ok).to.be.true;
			done();
		});
	});

	it('should be unhealty if above threshold', done => {
		check = new Check(getCheckConfig({
			threshold: 6000,
			direction: 'below'
		}));
		check.start();
		setTimeout(() => {
			expect(check.getStatus().ok).to.be.false;
			done();
		});
	})

	it('Should be possible to configure sample period', (done) => {
		check = new Check(getCheckConfig({
			samplePeriod: 60 * 10
		}));
		check.start();
		setTimeout(() => {
			let args = cloudWatchMock.firstCall.args[0];
			expect(args).to.have.property('Period');
			expect(args.Period).to.equal(600);
			done();
		});
	});

	it('Should be send sample period as ISO timestamp to CloudWatch API', (done) => {
		check = new Check(getCheckConfig({
			samplePeriod: 60 * 10
		}));
		check.start();
		setTimeout(() => {
			let args = cloudWatchMock.firstCall.args[0];
			const isoregex = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/;
			expect(args).to.have.property('StartTime');
			expect(args.StartTime).to.match(isoregex);
			expect(args).to.have.property('EndTime');
			expect(args.StartTime).to.match(isoregex);
			done();
		});
	});

	it('Should be possible to configure metric dimensions', (done) => {
		check = new Check(getCheckConfig({
			cloudWatchDimensions: [
				{
					Name: 'foo',
					Value: 'bar'
				}
			]
		}));
		check.start();
		setTimeout(() => {
			let args = cloudWatchMock.firstCall.args[0];
			expect(args).to.have.property('Dimensions');
			expect(args.Dimensions).to.have.length(1);
			expect(args.Dimensions[0].Name).to.equal('foo');
			expect(args.Dimensions[0].Value).to.equal('bar');
			done();
		});
	});

});
