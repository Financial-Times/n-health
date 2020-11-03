'use strict';

module.exports = {
	aggregate: require('./aggregate.check'),
	responseCompare: require('./responseCompare.check'),
	json: require('./json.check'),
	string: require('./string.check'),
	graphiteSpike: require('./graphiteSpike.check'),
	graphiteThreshold: require('./graphiteThreshold.check'),
	graphiteWorking: require('./graphiteWorking.check'),
	cloudWatchAlarm: require('./cloudWatchAlarm.check'),
	cloudWatchThreshold: require('./cloudWatchThreshold.check'),
	fastlyKeyExpiration: require('./fastlyKeyExpiration.check')
};
