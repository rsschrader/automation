function attachScriptRunnerButtonListener() {
    const buttonPlan = document.getElementById("run-test-plan-script");
    const buttonExecution = document.getElementById("run-test-execution-script");
    const messageBox = document.getElementById("script-response-message");
    const issueKey = window.AdaptavistBridgeContext?.context?.issueKey;
    let issueType = "";

    if (!buttonPlan || !buttonExecution || !messageBox) {
        setTimeout(attachScriptRunnerButtonListener, 200); return;
    }
    buttonPlan.style.display = "none"; buttonExecution.style.display = "none";

    if (!["QA-6358", "QA-57546", "QA-45036"].includes(issueKey)) { return; }

    const fetchWithTimeout = (url, options = {}, timeout = 300000) => {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), timeout);
        return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(tid));
    };

    const runAutomation = () => {
        //const runUrl = `https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/jira/run?JiraIssueType=${issueType}&JiraIssueKey=${issueKey}`;
        const runUrl = `https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/jira/type?JiraIssueKey=${issueKey}`;
        return fetchWithTimeout(runUrl, { method: "GET" })
        .then((response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then((data) => {
            messageBox.innerText = `${issueType}\n\n${issueKey} ${JSON.stringify(data, null, 2)}`;
        });
    };

    const typeUrl = `https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/jira/type?JiraIssueKey=${issueKey}`;
    fetchWithTimeout(typeUrl, { method: "GET" })
    .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    })
    .then((data) => {
        issueType = (data.fields?.issuetype?.name || "").replace(/ /g, "");
        let activeButton = null;
        switch (issueType) {
            case "TestPlan":
                buttonPlan.style.display = "block";
                activeButton = buttonPlan; break;   
            case "TestExecution":
                buttonExecution.style.display = "block";
                activeButton = buttonExecution; break;
            default:
                throw new Error(`JIRA Type error! Status: ${response.status}`);
        }
        if (activeButton && !activeButton.dataset.bound) {
            activeButton.dataset.bound = "1";
            activeButton.addEventListener("click", () => {
                runAutomation().catch((error) => {
                    console.error("Caught error in runAutomation:", error);
                    messageBox.innerText = "Test Automation is ERROR" + error.message;
                });
            });
        }
    })
    .catch((error) => {
        console.error("Caught error in /type fetch:", error);
        messageBox.innerText = "Test Automation is accessible only from the corporate network. (on-site or via VPN)";
    });
}
document.addEventListener("DOMContentLoaded", attachScriptRunnerButtonListener);
