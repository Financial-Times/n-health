'use strict';
const startup = require('./src/startup');
const Check = require('./src/checks/check');
const status = require('./src/checks/status');
const checks = require('./src/checks')

function categoryInCheckName(healthCheck, check){
	check.name = healthCheck.name + ': ' + check.name;
	return check;
}

module.exports = function(config, additionalChecks){
	let healthCheckMap = startup(config, additionalChecks);
	return{
		asMap: () => healthCheckMap,
		asArray: () => {
			let healthCheckArray = [];
			for (let healthCheck of healthCheckMap.values()) {
				let checks = healthCheck.checks.map(categoryInCheckName.bind(null, healthCheck));
				healthCheckArray = healthCheckArray.concat(checks);
			}

			return healthCheckArray;
		}
	}
};

module.exports.Check = Check;
module.exports.status = status;

module.exports.getCheck = conf => {
	return new checks[conf.ype](conf);
};

module.exports.runCheck = conf => {
	const check = new checks[conf.type](conf);
	check.start();
	return check();
};
