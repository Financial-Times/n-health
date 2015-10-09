'use strict';
const HealthChecks = require('./healthchecks');
const fs = require('fs');
const path = require('path');

function readConfigDir(configDir){
	if(!fs.existsSync(configDir)){
		throw new Error(`${configDir} does not exist`);
	}

	return fs.readdirSync(configDir);
}

function getConfigDir(){
	let cwd = process.cwd();
	let dirs = [
		path.resolve(cwd, 'healthchecks'),
		path.resolve(cwd, 'config')
	];

	for(let dir of dirs){
		if(fs.existsSync(dir)){
			return dir;
		}
	}

	throw new Error('Failed to find config directory checked ' + dirs.join(' & '));
}

function startup(configPath = null, additionalChecks = {}){
	let checks = require('./checks/');
	Object.assign(checks, additionalChecks);
	let configDir = configPath || getConfigDir();
	var healthCheckMap = new Map();
	readConfigDir(configDir).forEach(function(configFile){
		var name = configFile.replace('.js', '');
		var config = require(path.resolve(configDir, configFile));
		var healthchecks = new HealthChecks(config, checks);
		healthchecks.start();
		healthCheckMap.set(name, healthchecks);
	});

	return healthCheckMap;
}

module.exports = startup;
