'use strict';

const status = require('./status');
const Check = require('./check');
const fetch = require('node-fetch');
const fetchres = require('fetchres');
const ms = require('ms');

// Detects when the value of a metric climbs above/below a threshold value

class GraphiteThresholdCheck extends Check {

	constructor(options){
		super(options);
		this.threshold = options.threshold;
		this.direction = options.direction || 'above';

		this.samplePeriod = options.samplePeriod || '10min';

		if (options.graphiteBaseUrl) {
			this.graphiteBaseUrl = options.graphiteBaseUrl;
		} else {
			this.graphiteServiceId = options.graphiteServiceId || 'bbaf3ccf';
			this.graphiteApiKey = options.graphiteApiKey || process.env.HOSTEDGRAPHITE_READ_APIKEY;
			this.graphiteSalt = options.graphiteSalt || '1445340974.799'
			this.graphiteBaseUrl = `https://www.hostedgraphite.com/${this.graphiteServiceId}/${this.graphiteApiKey}/graphite/render/?_salt=${this.graphiteSalt}&`;
		}

		this.sampleUrl = this.generateUrl(options.metric, this.samplePeriod);

		this.checkOutput = 'Graphite threshold check has not yet run';
	}

	generateUrl(metric, period) {
		const urlBase = this.graphiteBaseUrl + `format=json&from=-${period}&target=`;
		return urlBase + `summarize(averageSeries(${metric}),"${period}","avg",true)`;
	}

	tick(){

		return fetch(this.sampleUrl)
			.then(res => {
				console.log(res.status, this.sampleUrl)
				return res;
			})
			.then(fetchres.json)
			.then(sample => {
				const value = sample[0].datapoints[0][0]
				let ok;

				if (this.direction === 'above') {
					ok = value <= this.threshold;
				} else {
					ok = value >= this.threshold;
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

module.exports = GraphiteThresholdCheck;
