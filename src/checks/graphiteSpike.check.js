'use strict';
/**
 * Detect spikes/troughs in a given metric compared to baseline historical data.
 *
 * Let's say for example you want to get a notification if there's a sudden increase in the average network response time for your API.
 *
 * You can detect data spikes by comparing a "sample" (say, the last ten minutes of data) against a longer "baseline" (say, the last seven days of data).
 *
 * If the sample of the thing you're measuring is significantly larger — or significantly smaller — than the baseline, then
 * it's considered to be an abberation; that is, a "spike".
 *
 * Sometimes the thing you want to measure is a ratio of two properties. For example: What's the amount of 5xx network responses (errors), compared
 * to the amount of 2xx network responses (normal traffic). You'd expect a small percent of errors, but you probably care about error spikes.
 *
 * numerator: The property you want to focus on; e.g. Response times or errors.
 * divisor: (optional) The property you want to compare against; e.g. Normal responses.
 * samplePeriod: How much time you want to look for spikes in. Too brief, and you might miss gradual spikes. Too long, and you might get false positives.
 * baselinePeriod: How long it takes to get a good average of your metric. It needs to be long enough to smooth out any past spikes.
 * direction: Whether you care about sample metric increases (up) or decreases (down).
 */

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
			return urlBase + `divideSeries(summarize(${this.seriesFunction}(transformNull(${numerator})),"${period}","${this.summarizeFunction}",true),summarize(${this.seriesFunction}(transformNull(${divisor})),"${period}","${this.summarizeFunction}",true))`;
		} else {
			return urlBase + `summarize(${this.seriesFunction}(transformNull(${numerator})),"${period}","${this.summarizeFunction}",true)`;
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

			const baselineValue = baseline[0].datapoints[0][0]
			const sampleValue = sample[0].datapoints[0][0]

			const data = this.normalize({
				sample: sample[0] && !Object.is(sampleValue, null) ? sampleValue : 0,
				// baseline should not be allowed to be smaller than one as it is use as a divisor
				baseline: baseline[0] && !Object.is(baselineValue, null) && !Object.is(baselineValue, 0) ? baselineValue : 1
			});

			const ok = this.direction === 'up'
				? data.sample / data.baseline < this.threshold
				: data.sample / data.baseline > 1 / this.threshold;

			const details = `Direction: ${this.direction} Sample: ${data.sample} Baseline: ${data.baseline} Threshold: ${this.threshold}`
			if (ok) {
				this.status = status.PASSED;
			 	this.checkOutput = `No spike detected in graphite data. ${details}`;
			} else {
				this.status = status.FAILED;
				this.checkOutput = `Spike detected in graphite data. ${details}`;
			}

		} catch(err) {
			logger.error({ event: `${logEventPrefix}_ERROR`, url: this.sampleUrl }, err);
			this.status = status.FAILED;
			this.checkOutput = 'Graphite spike check failed to fetch data: ' + err.message;
		}
	}
}

module.exports = GraphiteSpikeCheck;
