/*
 * Copyright (C) 2024 voidtools - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the GNU GPL v3 license
 *
 * You should have received a copy of the GNU GPL v3 license with
 * this file.
 */

const wildcardUrl = '\*://\*/\*';

// open new tab with view.html
browser.browserAction.onClicked.addListener(() => {
    browser.tabs.create({
        url:        browser.runtime.getURL("view.html"),
        // index:      0
    });
});

// listens to messages from view.js content-script
browser.runtime.onMessage.addListener(async (incommingMessage, sender) => {
    // console.log( // check if content script
    //     sender.tab
    //     ? "content script: " + sender.tab.url
    //     : "extension script"
    // );

    if (sender.id != "tab-saver@voidtools") {
        return Promise(fail => {
            fail("invalid source");
        });
    }

    /**
     * @param {Promise<0|-1>} action
     * @param {String} onSucces
     * @param {String} onFail
     * @returns {Promise<String>}
     */
    function CheckRetVal(action, onSucces, onFail) {
        return new Promise((resolve)=>{
            action().then(val =>{
                if (val == -1) {
                    resolve(onFail);
                }
                else {
                    resolve(onSucces);
                }
            });
        });
    }

    switch (incommingMessage.tab_saver_cmd) {
        case "saveWin":
            return CheckRetVal(
                SaveWinToFile,
                "saved current window tabs to file",
                "failed to save current window tabs"
            );
        case "save":
            return CheckRetVal(
                SaveToFile,
                "saved to file",
                "failed saving to file"
            );
        case "load":
            return CheckRetVal(
                LoadFromFile,
                "loaded file",
                "failed loading file"
            );
        default:
            // reply("invalid request");
            return Promise(_, fail => {
                fail("invalid request");
            });
    }
});

/**
 *
 * @returns {string} filename string with current date
 */
function fileName() {
    let date = new Date();
    let dateStr = date.toISOString().split('T')[0];
    let timeStr = date.toLocaleTimeString('nl-NL', {hour: "2-digit", minute: "2-digit"}).replaceAll(':', '-');
    return "tsj-" + dateStr + "_" + timeStr + ".json";
}

async function getMapOfTabsSeperatedByWindows() {
    const openWin = await browser.tabs.query({ url: wildcardUrl });
    let winMap = new Map();
    let value = "";
    let winId = -1;
    openWin.forEach(elem => {
        winId = elem.windowId;
        if (winMap.has(winId)) {
            value = winMap.get(winId);
            value.push(elem.url);
            winMap.set(winId, value);
        }
        else {
            value = new Array();
            value.push(elem.url);
            winMap.set(winId, value);
        }
        value = undefined;
    });

    return winMap;
}

function mapToJson(map) {
    return JSON.stringify(Object.fromEntries(map), null, 2);
}

/**
 * @param {string} Data
 */
async function DownloadData(Data, fileName = "tab-saver.json") {
    const blob = new Blob([Data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    browser.downloads.download({
        url: url,
        filename: fileName,
        saveAs: true,
    }, (downloadId)=>{
        // console.log("download started with id ", downloadId);
    });
}

async function SaveToFile() {
    try {
        const mapOfTabs = await getMapOfTabsSeperatedByWindows();
        const data = mapToJson(mapOfTabs);

        DownloadData(data, fileName());
    }
    catch (err) {
        console.error(err);
        return -1;
    }

    return 0;
}

async function SaveWinToFile() {
    try {
        const rawTabs = await browser.tabs.query({
            currentWindow: true
        });
        map = new Map();
        map.set(1, new Array());

        rawTabs.forEach(tab => {
            let list = map.get(1);
            list.push(tab.url);
            map.set(1, list);
        });

        const data = mapToJson(map);

        DownloadData(data);
    } catch (err) {
        console.error(err);
        return -1;
    }
}

async function LoadFromFile() {
    var content = "";

    try {
        var reader = new FileReader();
        var input = document.createElement('input');
        input.type = 'file';
        input.multiple = false;

        const filePromise = new Promise((resolve, reject) => {
            input.onchange = function(changeEvent) {
                const file = changeEvent.target.files[0];
                if (file) {
                    reader.readAsText(file, 'UTF-8');
                }
                else {
                    reject(new Error("no file selected"));
                }
            };

            reader.onload = function(readerEvent) {
                const text = readerEvent.target.result;
                resolve(text);
            };

            reader.onerror = function(err) {
                reject(err);
            };
        });

        input.click();
        content = await filePromise;
    }
    catch (err) {
        console.error(err);
        return -1;
    }

    const tabMap = stringToMap(content);
    await OpenTabsFromMap(tabMap);
    return 0
}

function stringToMap(str) {
    const jsonObj = JSON.parse(str);
    const entries = Object.entries(jsonObj);
    const map = new Map(entries);
    return map;
}

async function OpenTabsFromMap(map) {
    let previousKey = undefined;
    let currentWindow = undefined;
    await map.forEach(async (value, key) => {
        if (key != previousKey) {
            previousKey = key;
            currentWindow = await browser.windows.create({});
        }
        await value.forEach(async (url) => {
            await browser.tabs.create({
                url: url,
                windowId: currentWindow.id
            });
        });

        const emptyTabs = await browser.tabs.query({
            title: "New Tab",
            windowId: currentWindow.id
        });
        await browser.tabs.remove(emptyTabs.map(t=>t.id))
            .catch((e) => {
                console.error("failed closing tabs: ", e);
            }
        );
    });
}
