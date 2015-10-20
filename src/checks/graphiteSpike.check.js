'use strict';
const status = require('./status');
const Check = require('./check');
const fetchres = require('fetchres');

require('promise.prototype.finally');

/** Detects spikes/troughs in a given metric compared to baseline historical data */

class GraphiteSpikeCheck extends Check {

	constructor(options){
		super(options);
		this.threshold = options.threshold || 3;
		this.direction = options.direction || 'up';
		this.sampleUrl = this.generateUrl(options.numerator, options.divisor, options.samplePeriod || '10min');
		this.baselineUrl = this.generateUrl(options.numerator, options.divisor, options.baselinePeriod || '7d');
	}

	generateUrl(numerator, divisor, period) {
		const urlBase = `https://www.hostedgraphite.com/bbaf3ccf/${process.env.HOSTEDGRAPHITE_READ_APIKEY}/graphite/render/?_salt=1445340974.799&from=-${period}&format=json&target=`;
		if (divisor) {
			return urlBase + `divideSeries(summarize(sumSeries(${numerator}),"${period}","sum",true),summarize(sumSeries(${divisor}),"${period}","sum",true))`;
		} else {
			return urlBase + `summarize(sumSeries(${numerator}),"${period}","sum",true)`;
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
					ok = jsons[0][0].datapoints[0][0] / jsons[1][0].datapoints[0][0] < this.threshold;
				} else {
					ok = jsons[0][0].datapoints[0][0] / jsons[1][0].datapoints[0][0] > 1 / this.threshold;
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

