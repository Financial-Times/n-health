'use strict';

const logger = require('@financial-times/n-logger').default;
const status = require('./status');
const Check = require('./check');
const fetch = require('node-fetch');
const fetchres = require('fetchres');
const ms = require('ms');

const logEventPrefix = 'GRAPHITE_SPIKE_CHECK';

/** Detects spikes/troughs in a given metric compared to baseline historical data */

class GraphiteSpikeCheck extends Check {

	constructor(options){
		super(options);
		this.threshold = options.threshold || 3;
		this.direction = options.direction || 'up';

		this.samplePeriod = options.samplePeriod || '10min';
		this.baselinePeriod = options.baselinePeriod || '7d';
		this.seriesFunction = options.seriesFunction || 'sumSeries';
		this.summarizeFunction = options.summarizeFunction || 'sum';

		this.ftGraphiteBaseUrl = 'https://graphitev2-api.ft.com/render/?';
		this.ftGraphiteKey = process.env.FT_GRAPHITE_KEY;

		if(!this.ftGraphiteKey) {
			throw new Error('You must set FT_GRAPHITE_KEY environment variable');
		}

		if(!options.numerator) {
			throw new Error(`You must pass in a numerator for the "${options.name}" check - e.g., "next.heroku.article.*.express.start"`);
		}

		this.sampleUrl = this.generateUrl(options.numerator, options.divisor, this.samplePeriod);
		this.baselineUrl = this.generateUrl(options.numerator, options.divisor, this.baselinePeriod);

		// If there's no divisor specified we probably need to normalize sample and baseline to account for the difference in size between their time ranges
		this.shouldNormalize = typeof options.normalize !== 'undefined' ? options.normalize : !options.divisor;

		if(this.shouldNormalize) {
			this.sampleMs = ms(this.samplePeriod);
			this.baselineMs = ms(this.baselinePeriod);
		}

		this.checkOutput = 'Graphite spike check has not yet run';
	}

	generateUrl(numerator, divisor, period) {
		const urlBase = this.ftGraphiteBaseUrl + `from=-${period}&format=json&target=`;
		if(divisor) {
			return urlBase + `divideSeries(summarize(${this.seriesFunction}(${numerator}),"${period}","${this.summarizeFunction}",true),summarize(${this.seriesFunction}(${divisor}),"${period}","${this.summarizeFunction}",true))`;
		} else {
			return urlBase + `summarize(${this.seriesFunction}(${numerator}),"${period}","${this.summarizeFunction}",true)`;
		}
	}

	normalize(data) {
		if(this.shouldNormalize) {
			data.sample = data.sample / this.sampleMs;
			data.baseline = data.baseline / this.baselineMs;
		}

		return data;
	}

	async tick() {
		try {
			const [sample, baseline] = await Promise.all([
				fetch(this.sampleUrl, { headers: { key: this.ftGraphiteKey } })
					.then(fetchres.json),
				fetch(this.baselineUrl, { headers: { key: this.ftGraphiteKey } })
					.then(fetchres.json)
			])

			const data = this.normalize({
				sample: sample[0] ? sample[0].datapoints[0][0] : 0,
				// baseline should not be allowed to be smaller than one as it is use as a divisor
				baseline: baseline[0] ? baseline[0].datapoints[0][0] : 1
			});

			const ok = this.direction === 'up'
				? data.sample / data.baseline < this.threshold
				: data.sample / data.baseline > 1 / this.threshold;

			if (ok) {
				this.status = status.PASSED;
			 	this.checkOutput = 'No spike detected in graphite data';
			} else {
				this.status = status.FAILED;
				this.checkOutput = `Spike detected in graphite data. Sample: ${data.sample} Baseline: ${data.baseline} Threshold: ${this.threshold}`;
			}

		} catch(err) {
			logger.error({ event: `${logEventPrefix}_ERROR`, url: this.sampleUrl }, err);
			this.status = status.FAILED;
			this.checkOutput = 'Graphite spike check failed to fetch data: ' + err.message;
		}
	}
}

module.exports = GraphiteSpikeCheck;
