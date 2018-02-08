'use strict';

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

	constructor(options){
		super(options);
		this.ftGraphiteKey = process.env.FT_GRAPHITE_KEY;
		if (!this.ftGraphiteKey) {
			throw new Error('You must set FT_GRAPHITE_KEY environment variable');
		}

		if (!options.key) {
			throw new Error(`You must pass in a key for the "${options.name}" check - e.g., "next.heroku.article.*.express.start"`);
		}

		if (!/next\./.test(options.key)) {
			throw new Error(`You must prepend the key (${options.key}) with "next." for the "${options.name}" check - e.g., "heroku.article.*.express.start" needs to be "next.heroku.article.*.express.start"`);
		}

		const key = options.key;
		const time = options.time || '-15minutes';
		
		this.checkOutput = "This check has not yet run";
		this.key = key;
		this.url = encodeURI(`https://graphite-api.ft.com/render/?target=${key}&from=${time}&format=json`);
	}

	tick(){
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

				let count = json[0].datapoints.reduce((total, current) => total + (current[0] || 0), 0);

				log.info({ event: `${logEventPrefix}_COUNT`, key: this.key, count });
				if(count){
					this.status = status.PASSED;
					this.checkOutput =`${this.key} has received ${count} metrics in the last hour`;
				}else{
					this.status = status.FAILED;
					this.checkOutput = `${this.key} has not receieved any metrics on the last hour`;
				}

			})
			.catch(err => {
				logger.error({ event: `${logEventPrefix}_ERROR`, url: this.url }, err);
				this.status = status.FAILED;
				this.checkOutput = err.toString();
			});
	}
}

module.exports = GraphiteWorkingCheck;
