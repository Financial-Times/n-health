'use strict';

const logger = require('@financial-times/n-logger').default;
const status = require('./status');
const Check = require('./check');
const fetch = require('node-fetch');
const fetchres = require('fetchres');

const logEventPrefix = 'GRAPHITE_SUM_THRESHOLD_CHECK';

// Detects when the sum of all result values in a metric climbs above/below a threshold value

class GraphiteSumThresholdCheck extends Check {

	constructor (options) {
		super(options);
		this.threshold = options.threshold;
		this.direction = options.direction || 'above';
		this.from = options.from || '10min';
		this.ftGraphiteBaseUrl = 'https://graphite-api.ft.com/render/?';
        	this.ftGraphiteKey = process.env.FT_GRAPHITE_KEY;


		if (!this.ftGraphiteKey) {
			throw new Error('You must set FT_GRAPHITE_KEY environment variable');
		}
		
		if (!options.metric) {
			throw new Error(`You must pass in a metric for the "${options.name}" check - e.g., "next.heroku.article.*.express.start"`);
		}

		if (!/next\./.test(options.metric)) {
			throw new Error(`You must prepend the metric (${options.metric}) with "next." for the "${options.name}" check - e.g., "heroku.article.*.express.start" needs to be "next.heroku.article.*.express.start"`);
        }
        
		this.metric = options.metric;
		this.sampleUrl = `${this.ftGraphiteBaseUrl}format=json&from=-${this.from}&target=${this.metric}`;
		this.checkOutput = 'Graphite threshold check has not yet run';
	}

	tick () {

		return fetch(this.sampleUrl, { headers: { key: this.ftGraphiteKey } })
			.then(fetchres.json)
			.then(results => {
                const sum = this.sumResults(results);

                if ((this.direction === 'above' && sum > this.threshold) ||
                    (this.direction === 'below' && sum < this.threshold)) {
                    this.status = status.FAILED;
                    this.checkOutput = `Over the last ${this.from} the sum of results "${sum}" has moved ${this.direction} the threshold "${this.threshold}"`;
                } else {
                    this.status = status.PASSED;
                    this.checkOutput = `Over the last ${this.from} the sum of results "${sum}" has not moved ${this.direction} the threshold "${this.threshold}"`;
                }
			})
			.catch(err => {
				logger.error({ event: `${logEventPrefix}_ERROR`, url: this.sampleUrl }, err);
				this.status = status.FAILED;
				this.checkOutput = 'Graphite threshold check failed to fetch data: ' + err.message;
			});
    }
    
    sumResults (results) {
        let sum = 0;
        results.forEach((result) => {
            result.datapoints.forEach((value) => {
                sum += value[0] || 0;
            });
        });
        return sum;
    }

}

module.exports = GraphiteSumThresholdCheck;
