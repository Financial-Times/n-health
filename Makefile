include n.Makefile

.PHONY: test

test-unit:
	export HOSTEDGRAPHITE_READ_APIKEY=test-graph-key; mocha -r loadvars.js

test: verify test-unit
