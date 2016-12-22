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
			this.graphiteApiKey = options.graphiteApiKey || process.env.GRAPHITE_READ_APIKEY;
			this.graphiteSalt = options.graphiteSalt || '1445340974.799'
			this.graphiteBaseUrl = 'https://graphite-api.ft.com/render/?';
		}

		this.sampleUrl = this.generateUrl(options.metric, this.samplePeriod);

		this.checkOutput = 'Graphite threshold check has not yet run';
	}

	generateUrl(metric, period) {
		return this.graphiteBaseUrl + `format=json&from=-${period}&target=` + metric;
	}

	tick(){

		const headers = {
			key: this.graphiteApiKey
		};

		return fetch(this.sampleUrl, { headers: headers })
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
