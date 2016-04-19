'use strict';
const fetch = require('node-fetch');
const log = require('@financial-times/n-logger').default;

function getServiceRegistryData(){
	return fetch('http://next-registry.ft.com/')
		.then(response => {
			if(!response.ok){
				let err = new Error('Failed to fetch service registry');
				err.type = 'SERVICE_REGISTRY_FETCH_FAILURE';
				err.data = {status:response.status, statusText:response.statusText};
				throw err;
			}

			return response.json();
		})
}

function getHighestVersion(versions){
	let highestVersionNumber = Object.keys(versions).map(v => parseInt(v, 10)).sort().reverse()[0];
	return versions[highestVersionNumber.toString()];
}

function parseRegistryData(data){
	let map = new Map();
	let regex = /http:\/\/([a-z-]+)\.herokuapp.com/;
	try{
		for(let item of data){
			let serviceTier = item.tier;
			let activeVersion = getHighestVersion(item.versions);
			let nodes = activeVersion.nodes.forEach(n => {
				let nodeUrl =  typeof n === 'string' ? n : n.url;
				let matches = regex.exec(nodeUrl);
				if(matches && matches.length){
					let appName = matches[1];
					map.set(appName, serviceTier);
				}

			});
		}
	}catch(e){
		e.type = 'REGISTY_DATA_PARSE_ERROR';
		throw e;
	}

	return map;
}

let data;

function tick(){
	return getServiceRegistryData()
		.then(registry => {
			data = parseRegistryData(registry);
		});
}

function start(interval){
	setInterval(tick, interval);
	return tick();
}

module.exports = {
	start: start,
	getData: () => data
};



