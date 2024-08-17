function getStatusMsg(cnt) {
    return "status: " + cnt;
}
function getErrorMsg(cnt) {
    return "error: " + cnt;
}

function handleResponse(msg) {
    console.log("message from backend script: ", msg);
    statusDiv.innerText = getStatusMsg(msg);
}

function handleError(err) {
    statusDiv.innerText = getErrorMsg(err);
    console.error(err);
}

async function sendSave() {
    const sending = await browser.runtime.sendMessage({
        tab_saver_cmd: "save"
    });
    sending.then(handleResponse, handleError);
}

async function sendLoad() {
    const sending = await browser.runtime.sendMessage({
        tab_saver_cmd: "load"
    });
    sending.then(handleResponse, handleError);
}

// window.addEventListener("click", sendSave);
const saveBtn = document.getElementById("save");
const loadBtn = document.getElementById("load");
const statusDiv = document.getElementById("statusStr");

saveBtn.addEventListener("click", sendSave);
loadBtn.addEventListener("click", sendLoad);
