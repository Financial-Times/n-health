'use strict';

module.exports = {
	aggregate: require('./aggregate.check'),
	responseCompare: require('./responseCompare.check'),
	json: require('./json.check'),
	string: require('./string.check'),
	cloudWatchAlarm: require('./cloudWatchAlarm.check'),
	cloudWatchThreshold: require('./cloudWatchThreshold.check'),
	fastlyKeyExpiration: require('./fastlyKeyExpiration.check')
};
