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

		this.ftGraphiteBaseUrl = 'https://graphite-api.ft.com/render/?';
		this.ftGraphiteKey = process.env.FT_GRAPHITE_KEY;

		this.sampleUrl = this.generateUrl(options.metric, this.samplePeriod);

		this.checkOutput = 'Graphite threshold check has not yet run';
	}

	generateUrl(metric, period) {
		return this.graphiteBaseUrl + `format=json&from=-${period}&target=` + metric;
	}

	tick(){

		return fetch(this.sampleUrl, { headers: { key: this.ftGraphiteKey } })
			.then(fetchres.json)
			.then(sample => {
				const failed = sample.some(result => {
					return result.datapoints.some(value => {
						return this.direction === 'above' ?
							value[0] && value[0] > this.threshold :
							value[0] && value[0] < this.threshold;
					});
				});

				this.status = failed ? status.FAILED : status.PASSED;
				this.checkOutput = failed ? 'Spike detected in graphite data' : 'No spike detected in graphite data';
			})
			.catch(err => {
				console.error('Failed to get JSON', err);
				this.status = status.FAILED;
				this.checkOutput = 'Graphite spike check failed to fetch data: ' + err.message;
			});
	}

}

module.exports = GraphiteThresholdCheck;
