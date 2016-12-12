'use strict';
const Check = require('./check');
const status = require('./status');
const serviceRegistryAdaptor = require('../lib/serviceRegistryAdaptor');
const herokuAdaptor = require('../lib/herokuAdaptor');
const ms = require('ms');

class Memcheck extends Check {

	constructor(config){
		super(config);
		this.appsToCheck = config.apps || 'all';
		this.window = config.window || '10m';
		this.threshold = config.threshold || 2;
	}

	init () {
		return serviceRegistryAdaptor.start()
			.then(() => {
				let apps = serviceRegistryAdaptor.getData();
				if (this.appsToCheck === 'all') {
					this.apps = apps;
				} else {
					this.apps = new Map();
					for(let app of apps){
						if(this.appsToCheck.indexOf(app[0] > -1)){
							this.apps.set(app[0], app[1]);
						}
					}
				}
			});
	}

	tick(){
		let failures = new Map();
		let promises = Array.from(this.apps.keys()).map(app => {
			return herokuAdaptor.getR14Count(app, this.window)
				.then(count => {
					if(count > this.threshold){
						failures.set(app, count);
					}

					return count;
				});
		});

		Promise.all(promises).then(() => {
			if(failures.size === 0){
				this.status = status.PASSED;
				this.checkOutput = "All apps are ok";
			}else{
				let problemApps = Array.from(failures.keys());
				this.status = status.FAILED;
				this.checkOutput = `The following ${failures.size > 1 ? 'apps are' : 'app is'} using too much memory: ${problemApps.join(', ')}`
				let hasPlatinum = problemApps.some(a => {
					return this.apps.get(a) === 'platinum';
				});
				this.severity = hasPlatinum ? 2 : 3;
			}
		}).catch(e => {
			console.error(e);
		})
	}


}

module.exports = Memcheck;


