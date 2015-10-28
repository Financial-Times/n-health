'use strict';

const status = require('./status');
const Check = require('./check');
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

		if (options.graphiteBaseUrl) {
			this.graphiteBaseUrl = options.graphiteBaseUrl;
		} else {
			this.graphiteServiceId = options.graphiteServiceId || 'bbaf3ccf';
			this.graphiteKey = options.graphiteKey || process.env.HOSTEDGRAPHITE_READ_APIKEY;
			this.graphiteSalt = options.graphiteSalt || '1445340974.799'
			this.graphiteBaseUrl = `https://www.hostedgraphite.com/${this.graphiteServiceId}/${this.graphiteKey}/graphite/render/?_salt=${this.graphiteSalt}&`;
		}

		this.sampleUrl = this.generateUrl(options.numerator, options.divisor, this.samplePeriod);
		this.baselineUrl = this.generateUrl(options.numerator, options.divisor, this.baselinePeriod);

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
			return urlBase + `divideSeries(summarize(sumSeries(${numerator}),"${period}","sum",true),summarize(sumSeries(${divisor}),"${period}","sum",true))`;
		} else {
			return urlBase + `summarize(sumSeries(${numerator}),"${period}","sum",true)`;
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
				.then(fetchres.json)
		])
			.then(jsons => {

				return this.normalize({
					sample: jsons[0][0] ? jsons[0][0].datapoints[0][0] : 0,
					// baseline should not be allowed to be smaller than one as it is use as a divisor
					baseline: jsons[1][0] ? jsons[1][0].datapoints[0][0] : 1
				});
			})
			.then(data => {
				let ok;
				if (this.direction === 'up') {
					ok = data.sample / data.baseline < this.threshold;
				} else {
					ok = data.sample / data.baseline > 1 / this.threshold;
				}
				this.status = ok ? status.PASSED : status.FAILED;

				this.checkOutput = ok ? 'No spike detected in graphite data' : 'Spike detected in graphite data';
			})
			.catch(err => {
				console.error('Failed to get JSON', err);
				this.status = status.FAILED;
				this.checkOutput = 'Graphite spike check failed to fetch data: ' + err.message;
			});
	}

}

module.exports = GraphiteSpikeCheck;
