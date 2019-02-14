'use strict';
const Check = require('./check');
const status = require('./status');
const fetch = require('node-fetch');

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

	async tick(){
		try {
			const response = await fetch(this.url, { headers : this.headers });
			const json = await response.json();

			if(!response.ok){
				throw new Error(`Pingdom API returned ${json.error.statuscode}: ${json.error.errormessage}`);
			}

			this.status = (json.check.status === 'up') ? status.PASSED : status.FAILED;
			this.checkOutput = `Pingdom status: ${json.check.status}`;
		} catch(err) {
			this.status = status.FAILED;
			this.checkOutput = `Failed to get status: ${err.message}`;
		}
	}

}

module.exports = PingdomCheck;
