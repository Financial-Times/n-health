module.exports = {
	"name" : "pingdom-fixture",
	"description" : "",
	"checks": [
		{
			"type": "pingdom",
			"name": "test",
			"checkId": "1571768", // this is the gtg check for our fastly instance
			"severity": 2,
			"businessImpact" : "blah",
			"technicalSummary" : "god knows",
			"panicGuide" : "Don't Panic",
			"interval" : '60s'
		}
	]
};
