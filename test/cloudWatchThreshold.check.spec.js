'use strict';

const expect = require('chai').expect;
const configFixture = require('./fixtures/config/cloudWatchThresholdFixture');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const sinon = require('sinon');
const fs = require('fs');

function getCheckConfig (conf) {
	return Object.assign({}, configFixture.checks[0], conf || {});
}

function loadFixture(fixture) {
    var fixtureData = fs.readFileSync(fixture + '.json');
    return JSON.parse(fixtureData, function(key, val) {
        if (key === 'Timestamp') {
            return new Date(val);
        }
        return val;
    });
}

const dataFixture = loadFixture('./test/fixtures/cloudWatchThresholdResponse');
const cloudWatchDatapointMock = sinon.stub().returns({ promise: () => Promise.resolve(dataFixture) });

let cloudWatchMock;

const awsMock = {
	CloudWatch: function() {
		this.getMetricStatistics = cloudWatchMock
	}
}

const Check = proxyquire('../src/checks/cloudWatchThreshold.check', {'aws-sdk': awsMock});

describe('CloudWatch Threshold Check', () => {

	let check;

	afterEach(() => {
		cloudWatchDatapointMock.reset();
		check.stop();
	});

	it('Should be healthy if not above threshold', done => {
		cloudWatchMock = cloudWatchDatapointMock;
		check = new Check(getCheckConfig({
			threshold: 100
		}));
		check.start();
		setTimeout(() => {
			expect(check.getStatus().ok).to.be.true;
			done();
		});
	});

	it('should be unhealty if below threshold', done => {
		cloudWatchMock = cloudWatchDatapointMock;
		check = new Check(getCheckConfig({
			threshold: 40
		}));
		check.start();
		setTimeout(() => {
			expect(check.getStatus().ok).to.be.false;
			done();
		});
	})

	it('Should be healthy if not below threshold', (done) => {
		cloudWatchMock = cloudWatchDatapointMock;
		check = new Check(getCheckConfig({
			threshold: 40,
			direction: 'below'
		}));
		check.start();
		setTimeout(() => {
			expect(check.getStatus().ok).to.be.true;
			done();
		});
	});

	it('should be unhealty if above threshold', done => {
		cloudWatchMock = cloudWatchDatapointMock;
		check = new Check(getCheckConfig({
			threshold: 100,
			direction: 'below'
		}));
		check.start();
		setTimeout(() => {
			expect(check.getStatus().ok).to.be.false;
			done();
		});
	})

	it('Should be possible to configure sample period', (done) => {
		cloudWatchMock = cloudWatchDatapointMock;
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
		cloudWatchMock = cloudWatchDatapointMock;
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
		cloudWatchMock = cloudWatchDatapointMock;
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

	it('should have the metric value in the check output', (done) => {
		cloudWatchMock = cloudWatchDatapointMock;
		check = new Check(getCheckConfig());
		check.start();
		setTimeout(() => {
			expect(check.getStatus().checkOutput).to.match(/Current value: [\d.]+/);
			done();
		});
	});

	it('should use the latest datapoint if >1 datapoint is returned', (done) => {
		cloudWatchMock = cloudWatchDatapointMock;
		check = new Check(getCheckConfig());
		check.start();
		setTimeout(() => {
			expect(check.getStatus().checkOutput).to.match(/Current value: 99$/);
			done();
		});
	});

	it('should use a 90 second window for a 60 second period', (done) => {
		cloudWatchMock = cloudWatchDatapointMock;
		check = new Check(getCheckConfig({
			samplePeriod: 60
		}));
		check.start();
		setTimeout(() => {
			let args = cloudWatchMock.firstCall.args[0];
			let timeWindow = new Date(args.EndTime) - new Date(args.StartTime);
			expect(timeWindow).to.equal(90 * 1000);
			done();
		});
	});

	it('should use a 450 second window for a 300 second period', (done) => {
		cloudWatchMock = cloudWatchDatapointMock;
		check = new Check(getCheckConfig({
			samplePeriod: 300
		}));
		check.start();
		setTimeout(() => {
			let args = cloudWatchMock.firstCall.args[0];
			let timeWindow = new Date(args.EndTime) - new Date(args.StartTime);
			expect(timeWindow).to.equal(450 * 1000);
			done();
		});
	});
});
