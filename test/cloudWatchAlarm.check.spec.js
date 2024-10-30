'use strict';

const assert = require('node:assert/strict');
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
		assert.equal(cloudWatchSdkMock.CloudWatchClient.calledOnce, true);
		assert.equal(cloudWatchSdkMock.CloudWatchClient.calledWithNew(), true);
		assert.equal(cloudWatchSdkMock.DescribeAlarmsCommand.calledOnce, true);
		assert.equal(cloudWatchSdkMock.DescribeAlarmsCommand.calledWithNew(), true);
		assert.equal(cloudWatchClientMock.send.calledOnce, true);

		const sendArgs = cloudWatchClientMock.send.lastCall.args[0];
		assert.deepEqual(sendArgs, cloudWatchCommandMock);

		const commandArgs =
			cloudWatchSdkMock.DescribeAlarmsCommand.lastCall.args[0];
		assert.ok(commandArgs.AlarmNames);
		assert.ok(Array.isArray(commandArgs.AlarmNames));
		assert.equal(commandArgs.AlarmNames[0], 'test');
	});

	it('Should pass if the current state of the given alarm is OK', async () => {
		cloudWatchClientMock.send.returns(Promise.resolve(passedFixture));
		check = new Check(configFixture);
		check.start();
		await waitFor(10);
		assert.equal(check.getStatus().ok, true);
	});

	it('Should fail if the current state of the given alarm is ALARM', async () => {
		cloudWatchClientMock.send.returns(Promise.resolve(failedFixture));
		check = new Check(configFixture);
		check.start();
		await waitFor(10);
		assert.equal(check.getStatus().ok, false);
	});

	it('Should fail if there is no data', async () => {
		cloudWatchClientMock.send.returns(Promise.resolve(insufficentFixture));
		check = new Check(configFixture);
		check.start();
		await waitFor(10);
		assert.equal(check.getStatus().ok, false);
	});
});
