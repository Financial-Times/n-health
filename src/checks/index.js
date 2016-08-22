'use strict';

module.exports = {
	aggregate : require('./aggregate.check'),
	responseCompare : require('./responseCompare.check'),
	json : require('./json.check'),
	string : require('./string.check'),
	pingdom : require('./pingdom.check'),
	graphiteSpike: require('./graphiteSpike.check'),
	graphiteWorking: require('./graphiteWorking.check')
};
