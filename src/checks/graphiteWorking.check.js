const status = require('./status');
const Check = require('./check');
const fetch = require('node-fetch');
const log = require('@financial-times/n-logger').default;

const logEventPrefix = 'GRAPHITE_WORKING_CHECK';

function badJSON(message, json) {
	const err = new Error(message);
	log.error({ event: `${logEventPrefix}_BAD_JSON` }, err);
	throw err;
}

class GraphiteWorkingCheck extends Check {

	constructor (options) {
		options.technicalSummary = options.technicalSummary || 'There has been no metric data for a sustained period of time';
		options.panicGuide = options.panicGuide || 'Check this is up and running. Check this has been able to send metrics to Graphite (see Heroku and Splunk logs). Check Graphite has not been dropping metric data.';

		super(options);

		this.ftGraphiteKey = process.env.FT_GRAPHITE_KEY;
		if (!this.ftGraphiteKey) {
			throw new Error('You must set FT_GRAPHITE_KEY environment variable');
		}

		this.metric = options.metric || options.key;
		if (!this.metric) {
			throw new Error(`You must pass in a metric for the "${options.name}" check - e.g., "next.heroku.article.*.express.start"`);
		}

		const fromTime = options.time || '-15minutes';
		this.url = encodeURI(`https://graphite-api.ft.com/render/?target=${this.metric}&from=${fromTime}&format=json`);

		this.checkOutput = "This check has not yet run";
	}

	tick () {
		return fetch(this.url, { headers: { key: this.ftGraphiteKey } })
			.then(response => {
				if(!response.ok){
					throw new Error('Bad Response: ' + response.status);
				}

				return response.json();
			})
			.then(json => {
				if(!json.length){
					badJSON('returned JSON should be an array', json);
				}

				if(!json[0].datapoints){
					badJSON('No datapoints property', json);
				}

				if(json[0].datapoints.length < 1){
					badJSON('Expected at least one datapoint', json);
				}

				const simplifiedResults = json.map(result => {
					const nullsForHowLong = result.datapoints.reduce((xs, x) => x[0] === null ? xs + 1 : 0, 0);
					const simplifiedResult = { target: result.target, nullsForHowLong };
					log.info({ event: `${logEventPrefix}_NULLS_FOR_HOW_LONG` }, simplifiedResult);
					return simplifiedResult;
				});

				const failedResults = simplifiedResults.filter(r => r.nullsForHowLong > 2);

				if (failedResults.length === 0) {
					this.status = status.PASSED;
					this.checkOutput =`${this.metric} has data`;
				} else {
					this.status = status.FAILED;
					this.checkOutput = failedResults.map(r => `${r.target} has been null for ${r.nullsForHowLong} minutes.`).join(' ');
				}
			})
			.catch(err => {
				log.error({ event: `${logEventPrefix}_ERROR`, url: this.url }, err);
				this.status = status.FAILED;
				this.checkOutput = err.toString();
			});
	}
}

module.exports = GraphiteWorkingCheck;
