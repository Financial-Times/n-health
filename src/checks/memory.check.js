'use strict';
const Check = require('./check');
const status = require('./status');
const serviceRegistryAdaptor = require('../lib/serviceRegistryAdaptor');
const herokuAdaptor = require('../lib/herokuAdaptor');
const ms = require('ms');

class Memcheck extends Check {


	start(){
		return serviceRegistryAdaptor.start().then(() => {
			this.apps = serviceRegistryAdaptor.getData();
			super.start();
		});
	}

	tick(){
		let failures = new Map();
		let promises = Array.from(this.apps.keys()).map(app => {
			return herokuAdaptor.getR14Count(app, '10m')
				.then(count => {
					if(count > 0){
						failures.set(app, count);
					}
					return count;
				})
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


