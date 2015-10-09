'use strict';
const Check = require('./check');
const status = require('./status');
const ms = require('ms');
const fetch = require('node-fetch');
require('promise.prototype.finally');

export default class PingdomCheck extends Check{

	constructor(options){
		super(options);
		this.checkId = options.checkId;
		this.interval = ms(options.interval || '60s');
		this.url = `https://api.pingdom.com/api/2.0/checks/${this.checkId}`;
		this.headers = {
			'Authorization' : 'Basic ' + new Buffer(process.env.PINGDOM_USERNAME + ':' + process.env.PINGDOM_PASSWORD).toString('base64'),
			'App-Key' : 'ldbchjvwdc65gbj8grn1xuemlxrq487i',
			'Account-Email' : 'ftpingdom@ft.com'
		};
	}

	start(){
		this.int = setInterval(this.tick.bind(this), this.interval);
		this.tick();
	}

	stop(){
		clearInterval(this.int);
	}

	tick(){
		let pingdomCheck = this;

		fetch(this.url, {
			headers : this.headers
		})
			.then(function(response){
				if(!response.ok){
					throw new Error('Pingdom API returned ' + response.status);
				}

				return response.json();
			})
			.then(function(json) {
				pingdomCheck.status = (json.check.status === 'up') ? status.PASSED : status.FAILED;
			})
			.catch(function(err){
				pingdomCheck.status = status.FAILED;
				pingdomCheck.checkOutput = 'Failed to get status: ' + err.message;
			})
			.finally(function(){
				pingdomCheck.lastUpdated = new Date();
			});
	}

}
