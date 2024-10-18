'use strict';

const expect = require('chai').expect;
const configFixture = require('./fixtures/config/cloudWatchAlarmFixture')
	.checks[0];
const failedFixture = require('./fixtures/cloudWatchAlarmFailedResponse');
const insufficentFixture = require('./fixtures/cloudWatchAlarmInsuficientResponse');
const passedFixture = require('./fixtures/cloudWatchAlarmPassedResponse');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const sinon = require('sinon');

const cloudWatchClientMock = {
	send: sinon.stub()
};

const cloudWatchCommandMock = {};

const cloudWatchSdkMock = {
	CloudWatchClient: sinon.stub().returns(cloudWatchClientMock),
	DescribeAlarmsCommand: sinon.stub().returns(cloudWatchCommandMock)
};

const Check = proxyquire('../src/checks/cloudWatchAlarm.check', {
	'@aws-sdk/client-cloudwatch': cloudWatchSdkMock
});

function waitFor(time) {
	return new Promise((resolve) => setTimeout(resolve, time));
}

describe('CloudWatch Alarm Check', () => {
	let check;

	afterEach(() => {
		cloudWatchClientMock.send.reset();
		check.stop();
		sinon.restore();
	});

	it('Should call AWS using the given alarm name', async () => {
		cloudWatchClientMock.send.returns(Promise.resolve(passedFixture));
		check = new Check(configFixture);
		check.start();
		await waitFor(10);
		//
		expect(cloudWatchSdkMock.CloudWatchClient.calledOnce).to.be.true;
		expect(cloudWatchSdkMock.CloudWatchClient.calledWithNew()).to.be.true;
		expect(cloudWatchSdkMock.DescribeAlarmsCommand.calledOnce).to.be.true;
		expect(cloudWatchSdkMock.DescribeAlarmsCommand.calledWithNew()).to.be.true;
		expect(cloudWatchClientMock.send.calledOnce).to.be.true;

		const sendArgs = cloudWatchClientMock.send.lastCall.args[0];
		expect(sendArgs).to.deep.equal(cloudWatchCommandMock);

		const commandArgs =
			cloudWatchSdkMock.DescribeAlarmsCommand.lastCall.args[0];
		expect(commandArgs).to.have.property('AlarmNames');
		expect(commandArgs.AlarmNames).to.be.an('Array');
		expect(commandArgs.AlarmNames[0]).to.be.an('String');
		expect(commandArgs.AlarmNames[0]).to.equal('test');
	});

	it('Should pass if the current state of the given alarm is OK', async () => {
		cloudWatchClientMock.send.returns(Promise.resolve(passedFixture));
		check = new Check(configFixture);
		check.start();
		await waitFor(10);
		expect(check.getStatus().ok).to.be.true;
	});

	it('Should fail if the current state of the given alarm is ALARM', async () => {
		cloudWatchClientMock.send.returns(Promise.resolve(failedFixture));
		check = new Check(configFixture);
		check.start();
		await waitFor(10);
		expect(check.getStatus().ok).to.be.false;
	});

	it('Should fail if there is no data', async () => {
		cloudWatchClientMock.send.returns(Promise.resolve(insufficentFixture));
		check = new Check(configFixture);
		check.start();
		await waitFor(10);
		expect(check.getStatus().ok).to.be.false;
	});
});
