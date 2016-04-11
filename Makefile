.PHONY: test

install:
	npm install

verify:
	nbt verify --skip-layout-checks

test-unit:
	export HOSTEDGRAPHITE_READ_APIKEY=test-graph-key; mocha -r loadvars.js

test: verify test-unit
