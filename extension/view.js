/*
 * Copyright (C) 2024 voidtools - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the GNU GPL v3 license
 *
 * You should have received a copy of the GNU GPL v3 license with
 * this file.
 */

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

async function sendMsg(evt) {
    const sending = browser.runtime.sendMessage({
        tab_saver_cmd: evt.currentTarget.my_cmd
    });
    sending.then(handleResponse, handleError);
}

/**
 * registers a callback to the backend of the extension
 * @param {HTMLButtonElement} button
 * @param {string} cmd
 */
function registerCallback(button, cmd = "=_=") {
    button.addEventListener("click", sendMsg);
    button.my_cmd = "" + cmd;
}

const saveWinBtn = document.getElementById("saveWin");
const saveBtn = document.getElementById("saveAll");
const loadBtn = document.getElementById("load");
const statusDiv = document.getElementById("statusStr");

registerCallback(saveWinBtn, "saveWin");
registerCallback(saveBtn, "save");
registerCallback(loadBtn, "load");
