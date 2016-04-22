'use strict';

module.exports = {
	aggregate : require('./aggregate.check'),
	responseCompare : require('./responseCompare.check'),
	json : require('./json.check'),
	pingdom : require('./pingdom.check'),
	graphiteSpike: require('./graphiteSpike.check'),
	graphiteWorking: require('./graphiteWorking.check')
};
