const seperatorChar = '|';

/**
 *
 * @returns {string} filename string with current date
 */
function fileName() {
    let date = new Date();
    let dateStr = date.toISOString().split('T')[0];
    let timeStr = date.toLocaleTimeString('nl-NL', {hour: "2-digit", minute: "2-digit"}).replaceAll(':', '-');
    return "tab-saver-" + dateStr + "_" + timeStr + ".json";
}

async function getMapOfTabsSeperatedByWindows() {
    const openWin = await browser.tabs.query({ url: '\*://\*/\*' });
    let winMap = new Map();
    let value = "";
    let winId = -1;
    openWin.forEach(elem => {
        winId = elem.windowId;
        if (winMap.has(winId)) {
            value = winMap.get(winId);
            value.push(elem.url);// + seperatorChar;
            winMap.set(winId, value);
        }
        else {
            // winMap.set(winId, elem.url);
            value = new Array();
            value.push(elem.url);
            winMap.set(winId, value);
        }
        value = undefined;
    });

    return winMap;
}

function mapToJson(map) {
    return JSON.stringify(Object.fromEntries(map));
}

async function SaveToFile() {
    try {
        const mapOfTabs = await getMapOfTabsSeperatedByWindows();
        let data = mapToJson(mapOfTabs);
        console.log(data);

        const link = document.createElement("a");
        const file = new Blob([data], {type: 'text/json'});
        link.href = URL.createObjectURL(file);
        link.download = fileName();
        link.click();
        URL.revokeObjectURL(link.href);
    }
    catch (err) {
        console.error(err);
    }
}

async function LoadFromFile() {
    console.log("loading");
}

async function actionLister() {
    document.addEventListener("click", (e) => {
        async function RunAction(actionName) {
            switch (actionName) {
                case "save":
                    await SaveToFile();
                    break;

                case "load":
                    await LoadFromFile();
                    break;

                default:
                    console.error(actionName, " does not exist");
                    break;
            }
        }

        if (e.target.tagName !== "BUTTON" || !e.target.closest("#optionBtns")) {
            // ignore everything thats not our buttons
            return;
        }

        RunAction(e.target.id);
    });
}

function reportExecuteScriptError(error) {
    document.querySelector("#optionBtns").classList.add("hidden");
    document.querySelector("#error-content").classList.remove("hidden");
    console.error(`Failed to execute action script: ${error.message}`);
}

browser.tabs
    .executeScript({ file: "/actions/options.js" })
    .then(actionLister)
    .catch(reportExecuteScriptError);
