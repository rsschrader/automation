function attachScriptRunnerButtonListener() {
    const buttonPlan = document.getElementById("run-test-plan-script");
    const buttonExecution = document.getElementById("run-test-execution-script");
    const messageBox = document.getElementById("script-response-message");
    const issueKey = window.AdaptavistBridgeContext?.context?.issueKey;

    if (!buttonPlan || !buttonExecution || !messageBox) {
        setTimeout(attachScriptRunnerButtonListener, 200); return;
    }
    buttonPlan.style.display = "none"; buttonExecution.style.display = "none";

    // Only run for your allowed issues
    if (issueKey !== "QA-6358" && issueKey !== "QA-57546" && issueKey !== "QA-45036") { return; }

    const fetchWithTimeout = (url, options = {}, timeout = 300000) => {
        const controller = new AbortController(); const tid = setTimeout(() => controller.abort(), timeout);
        return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(tid));
    };

    const url = `https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/jira/type?JiraIssueKey=${issueKey}`;
    fetchWithTimeout(url, { method: "GET" })
    .then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
    })
    .then((data) => {
        const issueType = (data.fields?.issuetype?.name || "").replace(/ /g, "");
        if (issueType === "TestPlan") {
            buttonPlan.style.display = "block";
        } else if (issueType === "TestExecution") {
            buttonExecution.style.display = "block";
        } else {
            throw new Error(`Unexpected JIRA Type: ${issueType || "(empty)"}`);
        }
        messageBox.innerText = `${issueType}\n\n${issueKey} ${JSON.stringify(data, null, 2)}`;
    })
    .catch((error) => {
        console.error("Caught error in fetch:", error);
        messageBox.innerText = "Test Automation is accessible only from the corporate network. (on-site or via VPN)";
    });
}
document.addEventListener("DOMContentLoaded", attachScriptRunnerButtonListener);
