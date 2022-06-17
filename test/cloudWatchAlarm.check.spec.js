'use strict';

const expect = require('chai').expect;
const configFixture = require('./fixtures/config/cloudWatchAlarmFixture').checks[0];
const failedFixture = require('./fixtures/cloudWatchAlarmFailedResponse');
const insufficentFixture = require('./fixtures/cloudWatchAlarmInsuficientResponse');
const passedFixture = require('./fixtures/cloudWatchAlarmPassedResponse');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const sinon = require('sinon');

const cloudWatchFailedMock = sinon.stub().returns({ promise: () => Promise.resolve(failedFixture) });
const cloudWatchInsuficientMock = sinon.stub().returns({ promise: () => Promise.resolve(insufficentFixture) });
const cloudWatchPassedMock = sinon.stub().returns({ promise: () => Promise.resolve(passedFixture) });

let cloudWatchMock;

const awsMock = {
	CloudWatch: function() {
		this.describeAlarms = cloudWatchMock
	}
}

const Check = proxyquire('../src/checks/cloudWatchAlarm.check', {'aws-sdk': awsMock});

function waitFor(time) {
	return new Promise(resolve => setTimeout(resolve, time));
}

describe('CloudWatch Alarm Check', () => {

	let check;

	afterEach(() => {
		cloudWatchFailedMock.reset();
		cloudWatchPassedMock.reset();
		check.stop();
	});

	it('Should call AWS using the given alarm name', () => {
		cloudWatchMock = cloudWatchPassedMock;
		check = new Check(configFixture);
		check.start();
		return waitFor(10).then(() => {
			const args = cloudWatchPassedMock.lastCall.args[0];

			expect(cloudWatchPassedMock.called).to.be.true;
			expect(args).to.have.property('AlarmNames');
			expect(args.AlarmNames).to.be.an('Array');
			expect(args.AlarmNames[0]).to.be.an('String');
			expect(args.AlarmNames[0]).to.equal('test');
		});
	});

	it('Should pass if the current state of the given alarm is OK', () => {
		cloudWatchMock = cloudWatchPassedMock;
		check = new Check(configFixture);
		check.start();
		return waitFor(10).then(() => {
			expect(check.getStatus().ok).to.be.true;
		});
	});

	it('Should fail if the current state of the given alarm is ALARM', () => {
		cloudWatchMock = cloudWatchFailedMock;
		check = new Check(configFixture);
		check.start();
		return waitFor(10).then(() => {
			expect(check.getStatus().ok).to.be.false;
		});
	});

	it('Should fail if there is no data', () => {
		cloudWatchMock = cloudWatchInsuficientMock;
		check = new Check(configFixture);
		check.start();
		return waitFor(10).then(() => {
			expect(check.getStatus().ok).to.be.false;
		});
	});
});
