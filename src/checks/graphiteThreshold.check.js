'use strict';

const logger = require('@financial-times/n-logger').default;
const status = require('./status');
const Check = require('./check');
const fetch = require('node-fetch');
const fetchres = require('fetchres');
const ms = require('ms');

const logEventPrefix = 'GRAPHITE_THRESHOLD_CHECK';

// Detects when the value of a metric climbs above/below a threshold value

class GraphiteThresholdCheck extends Check {

	constructor(options){
		super(options);
		this.threshold = options.threshold;
		this.direction = options.direction || 'above';

		this.samplePeriod = options.samplePeriod || '10min';

		this.ftGraphiteBaseUrl = 'https://graphitev2-api.ft.com/render/?';
		this.ftGraphiteKey = process.env.FT_GRAPHITE_KEY;
		if (!this.ftGraphiteKey) {
			throw new Error('You must set FT_GRAPHITE_KEY environment variable');
		}
		
		if (!options.metric) {
			throw new Error(`You must pass in a metric for the "${options.name}" check - e.g., "next.heroku.article.*.express.start"`);
		}

		if (!/next\./.test(options.metric)) {
			throw new Error(`You must prepend the metric (${options.metric}) with "next." for the "${options.name}" check - e.g., "heroku.article.*.express.start" needs to be "next.heroku.article.*.express.start"`);
		}
		this.metric = options.metric;

		this.sampleUrl = this.generateUrl(options.metric, this.samplePeriod);

		this.checkOutput = 'Graphite threshold check has not yet run';
		
		// We lower the severity if we're getting bad responses from Graphite.
		this.originalSeverity = this.severity;
	}

	generateUrl(metric, period) {
		return this.ftGraphiteBaseUrl + `format=json&from=-${period}&target=` + metric;
	}

	tick(){

		return fetch(this.sampleUrl, { headers: { key: this.ftGraphiteKey } })
			.then(fetchres.json)
			.then(results => {
				const simplifiedResults = results.map(result => {
					const isFailing = result.datapoints.some(value => {
						if (value[0] === null) {
							// metric data is unavailable, we don't fail this threshold check if metric data is unavailable
							// if you want a failing check for when metric data is unavailable, use graphiteWorking
							return false;
						} else {
							return this.direction === 'above' ?
								Number(value[0]) > this.threshold :
								Number(value[0]) < this.threshold;
						}
					});
					return { target: result.target, isFailing };
				});

				const failed = simplifiedResults.some(result => result.isFailing);
				const failingMetrics = simplifiedResults.filter(result => result.isFailing).map(result => result.target);

				this.status = failed ? status.FAILED : status.PASSED;
				this.severity = this.originalSeverity;

				// The metric crossed a threshold
				this.checkOutput = failed ?
					`In the last ${this.samplePeriod}, the following metric(s) have moved ${this.direction} the threshold value of ${this.threshold}: ${failingMetrics.join(' ')}` :
					`No threshold error detected in graphite data for ${this.metric}.`;
			})
			.catch(err => {
				logger.error({ event: `${logEventPrefix}_ERROR`, url: this.sampleUrl }, err);
				this.status = status.FAILED;
				this.checkOutput = 'Graphite threshold check failed to fetch data: ' + err.message;
				this.severity = 3;
			});
	}

}

module.exports = GraphiteThresholdCheck;
