'use strict';
const Check = require('./check');
const serviceRegistryAdaptor = require('../lib/serviceRegistryAdaptor');

class Memcheck extends Check {


	start(){
		serviceRegistryAdaptor.start().then(() => {
			super.start();
		});
	}


}

module.exports = Memcheck;


