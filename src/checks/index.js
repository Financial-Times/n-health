'use strict';

module.exports = {
	aggregate : require('./aggregate.check'),
	responseCompare : require('./responseCompare.check'),
	json : require('./json.check'),
	string : require('./string.check'),
	pingdom : require('./pingdom.check'),
	graphiteSpike: require('./graphiteSpike.check'),
	graphiteThreshold: require('./graphiteThreshold.check'),
	graphiteSumThreshold: require('./graphiteSumThreshold.check'),
	graphiteWorking: require('./graphiteWorking.check'),
	cloudWatchAlarm: require('./cloudWatchAlarm.check'),
	cloudWatchThreshold: require('./cloudWatchThreshold.check'),
	keenThreshold: require('./keenThreshold.check'),
	keenSpike: require('./keenSpike.check')
};
