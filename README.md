# n-health

Makes it easy to add healthchecks to an app.  Extracted from the next-health repo.

## Types of Check

### Pingdom
Will poll the pingdom API to get the status of a specific check

### Nightwatch
Will get the results of an automated test from Saucelabs.

### Response Compare
Fetches from multiple urls and compares the responses.  Useful to check that replication is working

### Json
Calls a url, gets some json and runs a callback to check it's form

### Aggregate
Reports on the status of other checks.  Useful if you have a multi-region service and, if one check fails it is not as bad as if ALL the checks fail.

### Beacon
This check will most likely be removed as it goes straight to the Keen API.  If you want a healthcheck based on analytics, you'll need to rewrite this first!


## Adding Health Checks
To Add more health checks create a new file in the `config` directory.  It should be a .js file which exports an object.  The object must have the following properties:

* **name:** A name for the healthcheck - is supposed to match to a name in the CMDB, ideally
* **description:** Test description for the checks - for reference only
* **checks:** Array of checks - see below for check config


### Checks

#### Mandatory Fields

Every check must contain the following fields.  Most of these are required by the [FT Health Check Spec](https://docs.google.com/document/d/18hefJjImF5IFp9WvPAm9Iq5_GmWzI9ahlKSzShpQl1s/edit)

* **name:** This should be test describing the **successfull** state of the check
* **severity:** A number either 1, 2 or 3 describing the importance of the feature being checked
* **businessImpact:** The impact to the business/users if this service is down
* **technicalSummary:** Text explaining exactly what your check is testing
* **panicGuide:** A link to a panic guide (not currently implemented in any our checks, but any platinum service requires it)
* **type** The type of check (see above for types)


#### Additional Fields

Each Check has a couple of extra configuration options:

Each check that polls some kind of service will have an interval property which uses [ms](https://www.npmjs.com/package/ms)

##### Pingdom
* **checkId:** The id of the check in pingdom

##### Nightwatch
* **session**: The session name in Saucelabs for the tests

##### Aggregate
* **watch:** Array of names of checks to aggregate
* **mode:** Aggregate mode.  I think "atLeastOne" is the only valid option so far

##### responseCompare
* **urls:** An array of urls to call
* **comparison:** Type of comparison to apply to the responses (Only "equal" so far

##### json
* **url:** url to call and get the json
* **callback:** A function to run on the response.  Accepts the parsed json as an argument and should return true or false
