'use strict';

const logger = require('@dotcom-reliability-kit/logger');
const status = require('./status');
const Check = require('./check');
const fetch = require('node-fetch');
const fetchres = require('fetchres');

const logEventPrefix = 'GRAPHITE_THRESHOLD_CHECK';

// Detects when the value of a metric climbs above/below a threshold value

class GraphiteThresholdCheck extends Check {

	constructor(options){
		super(options);
		this.threshold = options.threshold;
		this.direction = options.direction || 'above';

		this.samplePeriod = options.samplePeriod || '10min';
		this.isConsistentBreach = options.isConsistentBreach || false;

		this.ftGraphiteBaseUrl = 'https://graphitev2-api.ft.com/render/?';
		this.ftGraphiteKey = process.env.FT_GRAPHITE_KEY;
		if (!this.ftGraphiteKey) {
			throw new Error('You must set FT_GRAPHITE_KEY environment variable');
		}

		if (!options.metric) {
			throw new Error(`You must pass in a metric for the "${options.name}" check - e.g., "next.heroku.article.*.express.start"`);
		}

		this.metric = options.metric;
		this.sampleUrl = this.generateUrl(options.metric, this.samplePeriod);

		this.checkOutput = 'Graphite threshold check has not yet run';
	}

	generateUrl(metric, period) {
		return this.ftGraphiteBaseUrl + `format=json&from=-${period}&target=` + metric;
	}

	async tick() {
		try {
			const results = await fetch(this.sampleUrl, {
				headers: { key: this.ftGraphiteKey }
			}).then(fetchres.json);

			const simplifiedResults = results.map(result => {

				const divideSeriesRegex = /divideSeries\(sumSeries\(.*?\),\s?sumSeries\(.*?\)\)/g;
				const asPercentRegex = /asPercent\(summarize\(sumSeries\(.*?\),.*?,.*?,.*?\),\s?summarize\(sumSeries\(.*?\),.*?,.*?,.*?\)\)/g;

				if(result.target && asPercentRegex.test(result.target) || result.target && divideSeriesRegex.test(result.target)){
					const fetchCountPerTimeUnit = result.datapoints.map(item => Number(item[0]));
					if(fetchCountPerTimeUnit.length !== 1){
						logger.debug({
							event: 'HEALTHCHECK_LENGTH_NOT_1',
							datapoints: result.datapoints
						});
					}
					const isFailing = this.direction === 'above' ?
					Number(fetchCountPerTimeUnit[0]) > this.threshold :
					Number(fetchCountPerTimeUnit[0]) < this.threshold;
					return { target: result.target, isFailing };
				}

				if(result.target && result.target.includes('summarize(sumSeries')){
					const fetchCountPerTimeUnit = result.datapoints.map(item => Number(item[0]));
					const sumUp = (previousValue, currentValue) => previousValue + currentValue;
					const talliedUp = fetchCountPerTimeUnit.reduce(sumUp);
					const isFailing = this.direction === 'above' ?
					Number(talliedUp) > this.threshold :
					Number(talliedUp) < this.threshold;
					return { target: result.target, isFailing };
				}

				const datapointFailureStatuses = result.datapoints.map(value => {
					if (value[0] === null) {
						// metric data is unavailable, we don't fail this threshold check if metric data is unavailable
						// if you want a failing check for when metric data is unavailable, use graphiteWorking
						logger.debug({
							event: `${logEventPrefix}_NULL_DATA`,
							url: this.sampleUrl,
						});
						return false;
					} else {
						return this.direction === 'above' ?
							Number(value[0]) > this.threshold :
							Number(value[0]) < this.threshold;
					}
				});

				const isFailing = this.isConsistentBreach
					? datapointFailureStatuses.every(Boolean)
					: datapointFailureStatuses.some(Boolean);

				return { target: result.target, isFailing };
			});

			const failed = simplifiedResults.some(result => result.isFailing);
			const failingMetrics = simplifiedResults.filter(result => result.isFailing).map(result => result.target);

			this.status = failed ? status.FAILED : status.PASSED;

			// The metric crossed a threshold
			this.checkOutput = failed ?
				`In the last ${this.samplePeriod}, the following metric(s) have moved ${this.direction} the threshold value of ${this.threshold}: ${failingMetrics.join(' ')}` :
				`No threshold error detected in graphite data for ${this.metric}.`;

		} catch(err) {
			logger.error({ event: `${logEventPrefix}_ERROR`, url: this.sampleUrl }, err);
			this.status = status.FAILED;
			this.checkOutput = 'Graphite threshold check failed to fetch data: ' + err.message;
		}
	}
}

module.exports = GraphiteThresholdCheck;
