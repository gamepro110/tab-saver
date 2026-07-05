FileName=tab-saver-json.zip
devEnvUrl=about:debugging\#/runtime/this-firefox

.PHONY: clearScreen

clearScreen:
	@clear

clean:
	@rm -i "${FileName}"

packageVersion: clean clearScreen
	@cd extension && zip -vrqv "../${FileName}" ./*
	@zip -vT "${FileName}"
	@zip -vsf "${FileName}"

openEnv: clearScreen
	@firefox-developer-edition --new-window "${devEnvUrl}"
