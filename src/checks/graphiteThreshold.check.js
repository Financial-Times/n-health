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
		const functionName = this.direction === 'above' ? 'maximumAbove' : 'minimumBelow';
		return urlBase + `${functionName}(${metric},${this.threshold})`;
	}

	tick(){

		return fetch(this.sampleUrl)
			.then(fetchres.json)
			.then(sample => {
				const ok = sample.length === 0;
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
