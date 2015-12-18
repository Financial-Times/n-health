'use strict';
const Check = require('./check');
const status = require('./status');

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
			.then(response => response.json())
			.then(response => {
				if(!response.statuscode !== 200){
					throw new Error(`Pingdom API returned ${response.statuscode}: ${response.errormessage}`);
				}

				return response;
			})

			.then(json => {
				this.status = (json.check.status === 'up') ? status.PASSED : status.FAILED;
				this.checkOutput = `Pingdom status: ${json.check.status}`;
			})
			.catch(err => {
				this.status = status.FAILED;
				this.checkOutput = `Failed to get status: ${err.message}`;
			})
	}

}

module.exports = PingdomCheck;
