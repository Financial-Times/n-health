.PHONY: test

install:
	npm install

verify:
	nbt verify --skip-layout-checks

test-unit:
	mocha -r loadvars.js

test: verify test-unit
