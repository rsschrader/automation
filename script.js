async function attachScriptRunnerButtonListener() {

    const statusButton = document.getElementById("run-status-button");
    const runButton    = document.getElementById("run-dynamic-button");

    const messageBox1  = document.getElementById("status-box-1");
    const messageBox2  = document.getElementById("status-box-2");
    const messageBox3  = document.getElementById("status-box-3");

    const issueKey = window.AdaptavistBridgeContext?.context?.issueKey;

    if (!statusButton || !runButton || !messageBox1 || !messageBox2 || !messageBox3 || !issueKey) {
        setTimeout(attachScriptRunnerButtonListener, 200);
        return;
    }

    console.log("UI ready. IssueKey:", issueKey);

    // --- Button: STATUS ---
    statusButton.addEventListener("click", () => {
        messageBox1.classList.remove("hidden");
        messageBox2.classList.add("hidden");
        messageBox3.classList.add("hidden");

        messageBox1.innerText =
            `STATUS button clicked\nIssueKey: ${issueKey}`;
    });

    // --- Button: RUN ---
    runButton.addEventListener("click", () => {
        messageBox1.classList.remove("hidden");
        messageBox2.classList.remove("hidden");
        messageBox3.classList.add("hidden");

        messageBox1.innerText = "RUN button clicked";
        messageBox2.innerText = "Second message box working";
    });
}

document.addEventListener("DOMContentLoaded", attachScriptRunnerButtonListener);
