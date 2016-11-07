# n-health

Makes it easy to add a variety of healthchecks to an app.

## Adding Health Checks
To Add more health checks create a new file in the `config` directory.  It should be a .js file which exports an object.  The object must have the following properties:

* name: A name for the healthcheck - is supposed to match to a name in the CMDB, ideally
* description: Test description for the checks - for reference only
* checks: Array of checks - see below for check config

## Standard check options

* name, severity, businessImpact, technicalSummary and panicGuide are all required. See the [specification](https://docs.google.com/document/edit?id=1ftlkDj1SUXvKvKJGvoMoF1GnSUInCNPnNGomqTpJaFk) for details
* interval: time between checks in milliseconds or any string compatible with [ms](https://www.npmjs.com/package/ms) [default: 1minute]
* type: The type of check (see below)

## Healthcheck types and options

### pingdom
Will poll the pingdom API to get the status of a specific check

* checkId: The id of the check in pingdom

### nightwatch
Will get the results of an automated test from Saucelabs.

* session: The session name in Saucelabs for the tests

### responseCompare
Fetches from multiple urls and compares the responses. Useful to check that replication is working

* urls: An array of urls to call
* comparison: Type of comparison to apply to the responses (Only "equal" so far

### json
Calls a url, gets some json and runs a callback to check its form

* url: url to call and get the json
* fetchOptions: Object to pass to fetch, see https://www.npmjs.com/package/node-fetch#options for more information.
* callback: A function to run on the response.  Accepts the parsed json as an argument and should return true or false

### aggregate
Reports on the status of other checks.  Useful if you have a multi-region service and, if one check fails it is not as bad as if ALL the checks fail.

* watch: Array of names of checks to aggregate
* mode: Aggregate mode.  I think "atLeastOne" is the only valid option so far

### graphiteSpike
Compares current and historical graphite metrics to see if there is a spike

* numerator: [required] Name of main graphite metric to count (may contain wildcards)
* divisor: [optional] Name of graphite metric to divide by (may contain wildcards)
* normalize: [optional] Boolean indicating whether to normalize to adjust for difference in size between sample and baseline timescales. Default is `true` if no divisor specified, `false` otherwise.
* samplePeriod: [default: '10min'] Length of time to count metrics for a sample of current behaviour
* baselinePeriod: [default: '7d'] Length of time to count metrics for to establish baseline behaviour
* direction: [default: 'up'] Direction in which to look for spikes; 'up' = sharp increase in activity, 'down' = sharp decrease in activity
* threshold: [default: 3] Amount of difference between current and baseline activity which registers as a spike e.g. 5 means current activity must be 5 times greater/less than the baseline activity

### graphiteThreshold
Checks whether the value of a graphite metric has crossed a threshold

* metric: [required] Name of graphite metric to count (may contain wildcards)
* threshold: [required] Value to check the metrics against
* samplePeriod: [default: '10min'] Length of time to count metrics for a sample of current behaviour
* direction: [default: 'above'] Direction on which to trigger the healthcheck;
	- 'above' = alert if value goes above the threshold
	- 'below' = alert if value goes below the threshold

### cloudWatchThreshold
Checks whether the value of a CloudWatch metric has crossed a threshold

_Note: this assumes that `AWS_ACCESS_KEY` & `AWS_SECRET_ACCESS_KEY` are implictly available as environment variables on process.env_


* cloudWatchRegion = [default 'eu-west-1'] AWS region the metrics are stored
* cloudWatchMetricName = [required] Name of the CloudWatch metric to count
* cloudWatchNamespace = [required] Namespace the metric resides in
* cloudWatchStatistic = [default 'Sum'] Data aggregation type to return
* cloudWatchDimensions = Optional array of metric data to query
* samplePeriod: [default: 300] Length of time in seconds to count metrics for a sample of current behaviour
* threshold: [required] Value to check the metrics against
* direction: [default: 'above'] Direction on which to trigger the healthcheck;
	- 'above' = alert if value goes above the threshold
	- 'below' = alert if value goes below the threshold

### cloudWatchAlarm
Checks whether the state of a CloudWatch alarm is health

_Note: this assumes that `AWS_ACCESS_KEY` & `AWS_SECRET_ACCESS_KEY` are implictly available as environment variables on process.env_

* cloudWatchRegion = [default 'eu-west-1'] AWS region the metrics are stored
* cloudWatchAlarmName = [required] Name of the CloudWatch alarm to check
