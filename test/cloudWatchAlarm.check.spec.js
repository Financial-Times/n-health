'use strict';

const expect = require('chai').expect;
const configFixture = require('./fixtures/config/cloudWatchAlarmFixture')
	.checks[0];
const failedFixture = require('./fixtures/cloudWatchAlarmFailedResponse');
const insufficentFixture = require('./fixtures/cloudWatchAlarmInsuficientResponse');
const passedFixture = require('./fixtures/cloudWatchAlarmPassedResponse');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const sinon = require('sinon');

let cloudWatchFailedMock; let cloudWatchInsuficientMock; let cloudWatchPassedMock;
let cloudWatchMock;

const awsMock = {
	CloudWatch: function () {
		this.describeAlarms = cloudWatchMock;
	}
};

const Check = proxyquire('../src/checks/cloudWatchAlarm.check', {
	'aws-sdk': awsMock
});

function waitFor(time) {
	return new Promise((resolve) => setTimeout(resolve, time));
}

describe('CloudWatch Alarm Check', () => {
	let check;
	beforeEach(() => {
		cloudWatchFailedMock = sinon
			.stub()
			.returns({ promise: () => Promise.resolve(failedFixture) });
		cloudWatchInsuficientMock = sinon
			.stub()
			.returns({ promise: () => Promise.resolve(insufficentFixture) });
		cloudWatchPassedMock = sinon
			.stub()
			.returns({ promise: () => Promise.resolve(passedFixture) });
	});

	afterEach(() => {
		cloudWatchFailedMock.reset();
		cloudWatchPassedMock.reset();
		check.stop();
		sinon.restore();
	});

	it('Should call AWS using the given alarm name', async () => {
		cloudWatchMock = cloudWatchPassedMock;
		check = new Check(configFixture);
		check.start();
		await waitFor(10);
		//
		const args = cloudWatchPassedMock.lastCall.args[0];
		expect(cloudWatchPassedMock.called).to.be.true;
		expect(args).to.have.property('AlarmNames');
		expect(args.AlarmNames).to.be.an('Array');
		expect(args.AlarmNames[0]).to.be.an('String');
		expect(args.AlarmNames[0]).to.equal('test');
	});

	it('Should pass if the current state of the given alarm is OK', async () => {
		cloudWatchMock = cloudWatchPassedMock;
		check = new Check(configFixture);
		check.start();
		await waitFor(10);
		expect(check.getStatus().ok).to.be.true;
	});

	it('Should fail if the current state of the given alarm is ALARM', async () => {
		cloudWatchMock = cloudWatchFailedMock;
		check = new Check(configFixture);
		check.start();
		await waitFor(10);
		expect(check.getStatus().ok).to.be.false;
	});

	it('Should fail if there is no data', async () => {
		cloudWatchMock = cloudWatchInsuficientMock;
		check = new Check(configFixture);
		check.start();
		await waitFor(10);
		expect(check.getStatus().ok).to.be.false;
	});
});
