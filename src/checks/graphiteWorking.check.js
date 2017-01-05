'use strict';
const status = require('./status');
const Check = require('./check');
const fetch = require('node-fetch');
const log = require('@financial-times/n-logger').default;

const logEventPrefix = 'GRAPHITE_WORKING_CHECK';

function badJSON(message, json){
	log.error(`event=${logEventPrefix}_BAD_JSON json=${JSON.stringify(json)}`);
	throw new Error(message);
}

class GraphiteWorkingCheck extends Check {

	constructor(options){
		super(options);
		this.checkOutput = "This check has not yet run";
		const key = options.key;
		const time = options.time || '-15minutes';
		if(!key){
			throw new Error('You must give a key');
		}
		this.key = key;
		this.url = encodeURI(`https://graphite-api.ft.com/render/?target=${key}&from=${time}&format=json`);
	}

	tick(){
		return fetch(this.url, { headers: { key: process.env.FT_GRAPHITE_KEY } })
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

				log.info(`event=${logEventPrefix}_COUNT key=${this.key} count=${count}`);
				if(count){
					this.status = status.PASSED;
					this.checkOutput =`${this.key} has received ${count} metrics in the last hour`;
				}else{
					this.status = status.FAILED;
					this.checkOutput = `${this.key} has not receieved any metrics on the last hour`;
				}

			})
			.catch(err => {
				log.error(`event=${logEventPrefix}_ERROR message=${err.message} stack="${err.stack.replace(/\n/g, '; ')}" url=${this.url}`);
				this.status = status.FAILED;
				this.checkOutput = err.toString();
			});
	}
}

module.exports = GraphiteWorkingCheck;
