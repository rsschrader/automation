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

    if (!["QA-62750", "QA-62632", "QA-45036"].includes(issueKey)) { return; }

    const fetchWithTimeout = (url, options = {}, timeout = 300000) => {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), timeout);
        return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(tid));
    };

    const runAutomation = () => {
        const runUrl = `https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/jira/run?JiraIssueType=${issueType}&JiraIssueKey=${issueKey}`;
        return fetchWithTimeout(runUrl, { method: "GET" })
        .then(async (response) => {
			const bodyText = await response.text(); let bodyJson = null;
      		try { bodyJson = bodyText ? JSON.parse(bodyText) : null; } catch {}

			if (!response.ok) {
				const error = new Error(`HTTP ${response.status} ${response.statusText || ""}`.trim());
				error.status = response.status; 
				error.statusText = response.statusText;
				error.body = bodyJson ?? bodyText; // <-- error payload captured here
				throw error;
			}
			return bodyJson ?? bodyText;

            //if (!response.ok) throw new Error(`HTTP ${response.status}`);
			//messageBox.innerText = response.text();
            //return response.json();
        })
        .then((data) => {
            messageBox.innerText = `${JSON.stringify(data, null, 2)}`;
			return data;
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
                messageBox.innerText = "Test Automation is accessible only from TestPlans or TestExecutions";
        }
        if (activeButton && !activeButton.dataset.bound) {
            activeButton.dataset.bound = "1";
            activeButton.addEventListener("click", () => {runAutomation()
				.then((response) => {
					if (!response.ok) throw new Error(`HTTP ${response.status}`);
					return response.json();
				})
				.then((data) => {
					messageBox.innerText = `${JSON.stringify(data, null, 2)}`;
				})
				.catch((error) => {
                    console.error("Caught error in runAutomation:", error);
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
