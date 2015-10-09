'use strict';
const status = require('./status');
const Check = require('./check');
const ms = require('ms');
const fetch = require('node-fetch');
require('promise.prototype.finally');

class JsonCheck extends Check{

	constructor(options){
		super(options);
		this.callback = options.callback;
		this.interval = ms(options.interval);
		this.url = options.url;
		this.checkResultInternal = options.checkResult;
	}

	get checkOutput(){
		return this.checkResultInternal[this.status];
	}

	start(){
		this.int = setInterval(this.tick.bind(this), this.interval);
		this.tick();
	}

	stop(){
		clearInterval(this.int);
	}

	tick(){
		let check = this;
		fetch(this.url)
			.then(function(response){
				if(!response.ok){
					throw new Error('BadResponse ' + response.status);
				}

				return response.json();
			})
			.then(function(json){
				let result = check.callback(json);
				check.status = result ? status.PASSED : status.FAILED;
			})
			.catch(function(err){
				console.error('Failed to get JSON', err);
				check.status = status.FAILED;
			})
			.finally(function(){
				check.lastUpdated = new Date();
			});
	}
}

module.exports = JsonCheck;

