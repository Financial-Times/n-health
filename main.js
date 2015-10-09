'use strict';
const startup = require('./src/startup');
const Check = require('./src/checks/check');
const status = require('./src/checks/status');

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
