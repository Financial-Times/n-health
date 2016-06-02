'use strict';

const status = require('./status');
const Check = require('./check');
const fetch = require('node-fetch');
const fetchres = require('fetchres');
const ms = require('ms');

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

		if (options.graphiteBaseUrl) {
			this.graphiteBaseUrl = options.graphiteBaseUrl;
		} else {
			this.graphiteServiceId = options.graphiteServiceId || 'bbaf3ccf';
			this.graphiteApiKey = options.graphiteApiKey || process.env.HOSTEDGRAPHITE_READ_APIKEY;
			this.graphiteSalt = options.graphiteSalt || '1445340974.799'
			this.graphiteBaseUrl = `https://www.hostedgraphite.com/${this.graphiteServiceId}/${this.graphiteApiKey}/graphite/render/?_salt=${this.graphiteSalt}&`;
		}

		this.sampleUrl = this.generateUrl(options.numerator, options.divisor, this.samplePeriod);
		this.baselineUrl = this.generateUrl(options.numerator, options.divisor, this.baselinePeriod);
		this.recoveryUrl = this.generateUrl(options.numerator, options.divisor, '5min');

		// If there's no divisor specified we probably need to normalize sample and baseline to account for the difference in size between their time ranges
		this.shouldNormalize = typeof options.normalize !== 'undefined' ? options.normalize : !options.divisor;
		if (this.shouldNormalize) {
			this.sampleMs = ms(this.samplePeriod);
			this.baselineMs = ms(this.baselinePeriod);
		}
		this.checkOutput = 'Graphite spike check has not yet run';
	}

	generateUrl(numerator, divisor, period) {
		const urlBase = this.graphiteBaseUrl + `from=-${period}&format=json&target=`;
		if (divisor) {
			return urlBase + `divideSeries(summarize(${this.seriesFunction}(${numerator}),"${period}","${this.summarizeFunction}",true),summarize(${this.seriesFunction}(${divisor}),"${period}","${this.summarizeFunction}",true))`;
		} else {
			return urlBase + `summarize(${this.seriesFunction}(${numerator}),"${period}","${this.summarizeFunction}",true)`;
		}
	}

	normalize (data) {
		if (this.shouldNormalize) {
			data.sample = data.sample / this.sampleMs;
			data.baseline = data.baseline / this.baselineMs;
		}

		return data;
	}

	tick(){

		return Promise.all([
			fetch(this.sampleUrl)
				.then(fetchres.json),
			fetch(this.baselineUrl)
				.then(fetchres.json),
			fetch(this.recoveryUrl)
				.then(fetchres.json)
		])
			.then(jsons => {
				return this.normalize({
					sample: jsons[0][0] ? jsons[0][0].datapoints[0][0] : 0,
					// baseline should not be allowed to be smaller than one as it is use as a divisor
					baseline: jsons[1][0] ? jsons[1][0].datapoints[0][0] : 1,
					recovery: jsons[2][0] ? jsons[2][0].datapoints[0][0] : 0
				});
			})
			.then(data => {
				let ok;
				let recovery;
				if (this.direction === 'up') {
					ok = data.sample / data.baseline < this.threshold;
					recovery = data.recovery / data.baseline < this.threshold;
				} else {
					ok = data.sample / data.baseline > 1 / this.threshold;
					recovery = data.recovery / data.baseline > 1 / this.threshold;
				}

				console.log(ok, recovery)
				this.status = (ok || recovery) ? status.PASSED : status.FAILED;

				if (ok) {
					this.checkOutput = 'No spike detected in graphite data';
				} else if (recovery) {
					this.checkOutput = 'Spike detected in graphite data, but seems to have recovered in the last 5 minutes';
				} else {
					this.checkOutput = 'Spike detected in graphite data';
				}
			})
			.catch(err => {
				console.error('Failed to get JSON', err);
				this.status = status.FAILED;
				this.checkOutput = 'Graphite spike check failed to fetch data: ' + err.message;
			});
	}

}

module.exports = GraphiteSpikeCheck;
