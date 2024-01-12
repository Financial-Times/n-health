'use strict';

const AWS = require('aws-sdk');
const moment = require('moment');
const logger = require('@dotcom-reliability-kit/logger');
const status = require('./status');
const Check = require('./check');

// Detects when the value of a metric climbs above/below a threshold value
class CloudWatchThresholdCheck extends Check {
	constructor(options) {
		super(options);

		this.threshold = options.threshold;
		this.direction = options.direction || 'above';
		this.samplePeriod = parseInt(options.samplePeriod, 10) || 60 * 5;

		this.cloudWatchRegion = options.cloudWatchRegion || 'eu-west-1';
		this.cloudWatchMetricName = options.cloudWatchMetricName;
		this.cloudWatchNamespace = options.cloudWatchNamespace;
		this.cloudWatchStatistic = options.cloudWatchStatistic || 'Sum';
		this.cloudWatchDimensions = options.cloudWatchDimensions || [];

		this.cloudWatch = new AWS.CloudWatch({
			region: this.cloudWatchRegion,
			apiVersion: '2010-08-01'
		});

		this.checkOutput = 'CloudWatch threshold check has not yet run';
	}

	generateParams() {
		// use a larger window when gathering stats, because CloudWatch
		// can take its sweet time with populating new datapoints.
		let timeWindow = this.samplePeriod * 1.5;
		const now = moment();
		return {
			EndTime: now.toISOString(),
			StartTime: now.subtract(timeWindow, 'seconds').toISOString(),
			MetricName: this.cloudWatchMetricName,
			Namespace: this.cloudWatchNamespace,
			Period: this.samplePeriod,
			Statistics: [this.cloudWatchStatistic],
			Dimensions: this.cloudWatchDimensions
		};
	}

	async tick() {
		const params = this.generateParams();

		try {
			const res = await this.cloudWatch.getMetricStatistics(params).promise();

			res.Datapoints.sort((a, b) => b['Timestamp'] - a['Timestamp']);
			const value = res.Datapoints[0][this.cloudWatchStatistic];

			const ok =
				this.direction === 'above'
					? value <= this.threshold
					: value >= this.threshold;

			this.status = ok ? status.PASSED : status.FAILED;
			this.checkOutput = ok
				? `No threshold change detected in CloudWatch data. Current value: ${value}`
				: `CloudWatch data ${this.direction} required threshold. Current value: ${value}`;
		} catch (err) {
			logger.error('Failed to get CloudWatch data', err);
			this.status = status.FAILED;
			this.checkOutput = `Cloudwatch threshold check failed to fetch data: ${err.message}`;
		}
	}
}

module.exports = CloudWatchThresholdCheck;
