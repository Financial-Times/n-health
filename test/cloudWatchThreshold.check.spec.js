'use strict';

const expect = require('chai').expect;
const configFixture = require('./fixtures/config/cloudWatchThresholdFixture');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const sinon = require('sinon');
const fs = require('fs');

function getCheckConfig(conf) {
	return Object.assign({}, configFixture.checks[0], conf || {});
}

function loadFixture(fixture) {
	let fixtureData = fs.readFileSync(fixture + '.json');
	return JSON.parse(fixtureData, function (key, val) {
		if (key === 'Timestamp') {
			return new Date(val);
		}
		return val;
	});
}

const dataFixture = loadFixture('./test/fixtures/cloudWatchThresholdResponse');

const cloudWatchClientMock = {
	send: sinon.stub()
};

const cloudWatchCommandMock = {};

const cloudWatchSdkMock = {
	CloudWatchClient: sinon.stub().returns(cloudWatchClientMock),
	GetMetricStatisticsCommand: sinon.stub().returns(cloudWatchCommandMock)
};

const Check = proxyquire('../src/checks/cloudWatchThreshold.check', {
	'@aws-sdk/client-cloudwatch': cloudWatchSdkMock
});

describe('CloudWatch Threshold Check', () => {
	let check;

	afterEach(() => {
		cloudWatchClientMock.send.reset();
		check.stop();
		sinon.restore();
	});

	it('Should be healthy if not above threshold', (done) => {
		cloudWatchClientMock.send.returns(Promise.resolve(dataFixture));
		check = new Check(
			getCheckConfig({
				threshold: 100
			})
		);
		check.start();
		setTimeout(() => {
			expect(check.getStatus().ok).to.be.true;
			done();
		});
	});

	it('should be unhealthy if below threshold', (done) => {
		cloudWatchClientMock.send.returns(Promise.resolve(dataFixture));
		check = new Check(
			getCheckConfig({
				threshold: 40
			})
		);
		check.start();
		setTimeout(() => {
			expect(check.getStatus().ok).to.be.false;
			done();
		});
	});

	it('Should be healthy if not below threshold', (done) => {
		cloudWatchClientMock.send.returns(Promise.resolve(dataFixture));
		check = new Check(
			getCheckConfig({
				threshold: 40,
				direction: 'below'
			})
		);
		check.start();
		setTimeout(() => {
			expect(check.getStatus().ok).to.be.true;
			done();
		});
	});

	it('should be unhealthy if above threshold', (done) => {
		cloudWatchClientMock.send.returns(Promise.resolve(dataFixture));
		check = new Check(
			getCheckConfig({
				threshold: 100,
				direction: 'below'
			})
		);
		check.start();
		setTimeout(() => {
			expect(check.getStatus().ok).to.be.false;
			done();
		});
	});

	it('Should be possible to configure sample period', (done) => {
		cloudWatchClientMock.send.returns(Promise.resolve(dataFixture));
		check = new Check(
			getCheckConfig({
				samplePeriod: 60 * 10
			})
		);
		check.start();
		setTimeout(() => {
			let args = cloudWatchSdkMock.GetMetricStatisticsCommand.lastCall.args[0];
			expect(args).to.have.property('Period');
			expect(args.Period).to.equal(600);
			done();
		});
	});

	it('Should be send sample period as ISO timestamp to CloudWatch API', (done) => {
		cloudWatchClientMock.send.returns(Promise.resolve(dataFixture));
		check = new Check(
			getCheckConfig({
				samplePeriod: 60 * 10
			})
		);
		check.start();
		setTimeout(() => {
			let args = cloudWatchSdkMock.GetMetricStatisticsCommand.lastCall.args[0];
			expect(args).to.have.property('StartTime');
			expect(args.StartTime).to.be.an.instanceof(Date);
			expect(args).to.have.property('EndTime');
			expect(args.EndTime).to.be.an.instanceof(Date);
			done();
		});
	});

	it('Should be possible to configure metric dimensions', (done) => {
		cloudWatchClientMock.send.returns(Promise.resolve(dataFixture));
		check = new Check(
			getCheckConfig({
				cloudWatchDimensions: [
					{
						Name: 'foo',
						Value: 'bar'
					}
				]
			})
		);
		check.start();
		setTimeout(() => {
			let args = cloudWatchSdkMock.GetMetricStatisticsCommand.lastCall.args[0];
			expect(args).to.have.property('Dimensions');
			expect(args.Dimensions).to.have.length(1);
			expect(args.Dimensions[0].Name).to.equal('foo');
			expect(args.Dimensions[0].Value).to.equal('bar');
			done();
		});
	});

	it('should have the metric value in the check output', (done) => {
		cloudWatchClientMock.send.returns(Promise.resolve(dataFixture));
		check = new Check(getCheckConfig());
		check.start();
		setTimeout(() => {
			expect(check.getStatus().checkOutput).to.match(/Current value: [\d.]+/);
			done();
		});
	});

	it('should use the latest datapoint if >1 datapoint is returned', (done) => {
		cloudWatchClientMock.send.returns(Promise.resolve(dataFixture));
		check = new Check(getCheckConfig());
		check.start();
		setTimeout(() => {
			expect(check.getStatus().checkOutput).to.match(/Current value: 99$/);
			done();
		});
	});

	it('should use a 90 second window for a 60 second period', (done) => {
		cloudWatchClientMock.send.returns(Promise.resolve(dataFixture));
		check = new Check(
			getCheckConfig({
				samplePeriod: 60
			})
		);
		check.start();
		setTimeout(() => {
			let args = cloudWatchSdkMock.GetMetricStatisticsCommand.lastCall.args[0];
			let timeWindow = new Date(args.EndTime) - new Date(args.StartTime);
			expect(timeWindow).to.equal(90 * 1000);
			done();
		});
	});

	it('should use a 450 second window for a 300 second period', (done) => {
		cloudWatchClientMock.send.returns(Promise.resolve(dataFixture));
		check = new Check(
			getCheckConfig({
				samplePeriod: 300
			})
		);
		check.start();
		setTimeout(() => {
			let args = cloudWatchSdkMock.GetMetricStatisticsCommand.lastCall.args[0];
			let timeWindow = new Date(args.EndTime) - new Date(args.StartTime);
			expect(timeWindow).to.equal(450 * 1000);
			done();
		});
	});
});
