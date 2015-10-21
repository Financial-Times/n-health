'use strict';
const Check = require('./check');
const status = require('./status');
require('promise.prototype.finally');

class PingdomCheck extends Check{

	constructor(options){
		super(options);
		this.checkId = options.checkId;
		this.url = `https://api.pingdom.com/api/2.0/checks/${this.checkId}`;
		this.headers = {
			'Authorization' : 'Basic ' + new Buffer(process.env.PINGDOM_USERNAME + ':' + process.env.PINGDOM_PASSWORD).toString('base64'),
			'App-Key' : 'ldbchjvwdc65gbj8grn1xuemlxrq487i',
			'Account-Email' : 'ftpingdom@ft.com'
		};
		this.checkOutput = `Pingdom check ${this.checkId} has not yet run`;
	}

	tick(){
		return fetch(this.url, {
			headers : this.headers
		})
			.then(response => {
				if(!response.ok){
					throw new Error('Pingdom API returned ' + response.status);
				}

				return response.json();
			})
			.then(json =>  {
				if (json.check.status === 'up') {
					this.status = status.PASSED;
					this.checkOutput = `Pingdom check ${this.checkId} ok`;
				} else {
					this.status = status.FAILED;
					this.checkOutput = `Pingdom check ${this.checkId} not ok`;
				}
			})
			.catch(err => {
				this.status = status.FAILED;
				this.checkOutput = `Failed to get status for pingdom check ${this.checkId}: ${err.message}`;
			})
	}

}

module.exports = PingdomCheck;
