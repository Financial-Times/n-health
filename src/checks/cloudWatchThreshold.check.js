'use strict';

const AWS = require('aws-sdk');
const moment = require('moment');
const log = require('@financial-times/n-logger').default;
const status = require('./status');
const Check = require('./check');

// Detects when the value of a metric climbs above/below a threshold value
class CloudWatchThresholdCheck extends Check {

	constructor(options){
		super(options);

		this.threshold = options.threshold;
		this.direction = options.direction || 'above';
		this.samplePeriod = parseInt(options.samplePeriod, 10) || 60 * 5;

		this.cloudWatchRegion = options.cloudWatchRegion || 'eu-west-1';
		this.cloudWatchMetricName = options.cloudWatchMetricName;
		this.cloudWatchNamespace = options.cloudWatchNamespace;
		this.cloudWatchStatistic = options.cloudWatchStatistic || 'Sum';
		this.cloudWatchDimensions = options.cloudWatchDimensions || [];

		this.cloudWatch = new AWS.CloudWatch({region: this.cloudWatchRegion, apiVersion: '2010-08-01'});

		this.checkOutput = 'CloudWatch threshold check has not yet run';
	}

	generateParams() {
		return  {
			EndTime: moment().toISOString(),
			StartTime: moment().subtract(this.samplePeriod, 'seconds').toISOString(),
			MetricName: this.cloudWatchMetricName,
			Namespace: this.cloudWatchNamespace,
			Period: this.samplePeriod,
			Statistics: [this.cloudWatchStatistic],
			Dimensions: this.cloudWatchDimensions
		};
	}

	tick() {
		const params = this.generateParams();

		return this.cloudWatch
				.getMetricStatistics(params)
				.promise()
				.then(res => {
					const value = res.Datapoints
								.map(datum => datum[this.cloudWatchStatistic])
								.reduce((a, b) => a + b, 0);
					let ok;

					if (this.direction === 'above') {
						ok = value <= this.threshold;
					} else {
						ok = value >= this.threshold;
					}

					this.status = ok ? status.PASSED : status.FAILED;
					this.checkOutput = ok ? `No threshold change detected in CloudWatch data. Current value: ${value}` : `CloudWatch data ${this.direction} required threshold. Current value: ${value}`;
				})
				.catch(err => {
					log.error('Failed to get CloudWatch data', err);
					this.status = status.FAILED;
					this.checkOutput = `Cloudwatch threshold check failed to fetch data: ${err.message}`;
				});
	}
}

module.exports = CloudWatchThresholdCheck;
