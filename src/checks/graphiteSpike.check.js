'use strict';
const status = require('./status');
const Check = require('./check');

require('promise.prototype.finally');

/** Detects spikes/troughs in a given metric compared to baseline historical data */

class GraphiteSpikeCheck extends Check{

	constructor(options){
		super(options);
		this.threshold = options.threshold || 2;
		this.direction = options.direction || 'up';
		this.sampleUrl = this.generateUrl(options.numeratorProperty, options.divisorProperty, options.samplePeriod || '10min');
		this.baselineUrl = this.generateUrl(options.numeratorProperty, options.divisorProperty, options.baselinePeriod || '7d');
	}

	generateUrl(numerator, divisor, period) {

		if (divisor) {
			return `https://www.hostedgraphite.com/bbaf3ccf/graphite/render/?_salt=1445340974.799&target=divideSeries(summarize(sumSeries(${numerator})%2C%22${period}%22)%2Csummarize(sumSeries(${divisor})%2C%22${period}%22))&from=-${period}&format=json`;
		} else {
			return `https://www.hostedgraphite.com/bbaf3ccf/graphite/render/?_salt=1445340974.799&target=summarize(sumSeries(${numerator})%2C%22${period}%22)&from=-${period}&format=json`;
		}

	}

	tick(){
		Promise.all([
			fetch(this.sampleUrl)
				.then(fetchres.json),
			fetch(this.baselineUrl)
				.then(fetchres.json)
		])
			.then(jsons => {

				let ok;

				if (this.direction === 'up') {
					ok = jsons[0].data[0].datapoints[1] / jsons[1].data[0].datapoints[1] < this.threshold;
				} else {
					ok = jsons[0].data[0].datapoints[1] / jsons[1].data[0].datapoints[1] > 1 / this.threshold;
				}

				this.status = ok ? status.PASSED : status.FAILED;
			})
			.catch(err => {
				console.error('Failed to get JSON', err);
				this.status = status.FAILED;
			})
			.finally(() => {
				this.lastUpdated = new Date();
			});
	}

}

module.exports = GraphiteSpikeCheck;

