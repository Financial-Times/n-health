.PHONY: test


verify:
	nbt verify --skip-layout-checks | grep -v Warning

unit-test:
	mocha

test: unit-test verify
