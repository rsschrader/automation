
function attachScriptRunnerButtonListener() {
    const buttonPlan = document.getElementById("run-test-plan-script");
    const buttonExecution = document.getElementById("run-test-execution-script");
    const messageBox = document.getElementById("script-response-message");
    const issueKey = window.AdaptavistBridgeContext?.context?.issueKey;
    
    if (issueKey !== "QA-6358" && issueKey !== "QA-57546" && issueKey !== "QA-45036") {
		return;
	}
    const fetchWithTimeout = (url, options = {}, timeout = 300000) => {
        return Promise.race([
            fetch(url, options), new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), timeout))
        ]);
    };
    try {
        const response = await fetchWithTimeout(
            `https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/jira/type?JiraIssueKey=${issueKey}`,{ method: 'GET' }
        );
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        const issueType = data.fields.issuetype.name.replace(/ /g, "");
        messageBox.innerText = `${issueType}\n\n${issueKey} ${JSON.stringify(data, null, 2)}`;
        switch (issueType) {
            case "TestPlan":
                buttonPlan.style.display = "block";
                messageBox.innerText = `${issueType}\n\n${issueKey} ${JSON.stringify(data, null, 2)}`;
                break;   
            case "TestExecution":
                buttonExecution.style.display = "block";
                messageBox.innerText = `${issueType}\n\n${issueKey} ${JSON.stringify(data, null, 2)}`;
                break;
            default:
                throw new Error(`JIRA Type error! Status: ${response.status}`);
        }
    } catch (error) {
        console.error("Caught error in fetch:", error);
        messageBox.innerText = "Test Automation is accessible only from the corporate network. (on-site or via VPN)";
    }
}
document.addEventListener("DOMContentLoaded", attachScriptRunnerButtonListener);
