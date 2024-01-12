'use strict';

const AWS = require('aws-sdk');
const logger = require('@dotcom-reliability-kit/logger');
const status = require('./status');
const Check = require('./check');

// Polls the current state of a CloudWatch metric alarm
class CloudWatchAlarmCheck extends Check {
	constructor(options) {
		super(options);

		this.cloudWatchRegion = options.cloudWatchRegion || 'eu-west-1';
		this.cloudWatchAlarmName = options.cloudWatchAlarmName;
		this.cloudWatch = new AWS.CloudWatch({
			region: this.cloudWatchRegion,
			apiVersion: '2010-08-01'
		});

		this.stateToStatus = {
			OK: status.PASSED,
			ALARM: status.FAILED,
			INSUFFICIENT_DATA: status.FAILED
		};

		this.checkOutput = 'CloudWatch alarm check has not yet run';
	}

	tick() {
		const name = this.cloudWatchAlarmName;
		const params = {
			AlarmNames: [name]
		};

		return this.cloudWatch
			.describeAlarms(params)
			.promise()
			.then((res) => {
				const state = res.MetricAlarms[0].StateValue;
				this.status = this.stateToStatus[state];

				let output;

				switch (state) {
					case 'OK':
						output = `CloudWatch alarm ${name} in OK state.`;
						break;
					case 'ALARM':
						output = `CloudWatch alarm ${name} in ALARM state`;
						break;
					case 'INSUFFICIENT_DATA':
						output = `CloudWatch alarm ${name} has insufficent data.`;
				}

				this.checkOutput = output;
			})
			.catch((err) => {
				logger.error('Failed to get CloudWatch alarm data', err);
				this.status = status.FAILED;
				this.checkOutput = `Cloudwatch alarm check failed to fetch data: ${err.message}`;
			});
	}
}

module.exports = CloudWatchAlarmCheck;
