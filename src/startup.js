'use strict';
const HealthChecks = require('./healthchecks');
const fs = require('fs');
const path = require('path');
const checks = require('./checks/');

function readConfigDir(configDir){
	if (!fs.existsSync(configDir)){
		throw new Error(`${configDir} does not exist`);
	}

	return fs.readdirSync(configDir);
}

function getConfigDir(){
	const cwd = process.cwd();
	const dirs = [
		path.resolve(cwd, 'healthchecks'),
		path.resolve(cwd, 'config')
	];

	for (let dir of dirs){
		if (fs.existsSync(dir)){
			return dir;
		}
	}

	throw new Error(`Failed to find config directory checked ${dirs.join(' & ')}`);
}

function startup(configPath, additionalChecks){
	if (arguments.length === 1 && typeof configPath !== 'string'){
		configPath = additionalChecks;
		additionalChecks = null;
	}

	Object.assign(checks, additionalChecks);

	const configDir = configPath || getConfigDir();
	const healthCheckMap = new Map();

	readConfigDir(configDir).forEach(function(configFile){

		if(configFile.indexOf('.json') > -1){
			return;
		}

		if(configFile.endsWith('.map')){
			return;
		}

		const name = configFile.replace('.js', '');
		const config = require(path.resolve(configDir, configFile));
		const healthchecks = new HealthChecks(config, checks);

		healthchecks.start();
		healthCheckMap.set(name, healthchecks);
	});

	return healthCheckMap;
}

module.exports = startup;
