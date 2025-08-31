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

	function fetchWithTimeout(url, timeout) {
		const controller = new AbortController();
		const tid = setTimeout(() => controller.abort(), timeout);
		return fetch(url, { method: "GET", signal: controller.signal }).finally(() => clearTimeout(tid));
	}

	const buttonPing = document.getElementById("run-test_ping-script"); buttonPing.style.display = "block";
	if (buttonPing) {
	  	buttonPing.addEventListener("click", async function () {
			const pingUrl = `https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/ping`;
			fetchWithTimeout(pingUrl, 2500)
			.then((response) => {
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				return response.json();
			})
			.then((data) => {
				messageBox.innerText = `${JSON.stringify(data, null, 2)}`;
			})
			.catch((error) => {
				console.error("Caught error in /type fetch:", error);
				messageBox.innerText = "PINGGGGG network. (on-site or via VPN)" + error.message;
				return error.message;
			});
	  	});
	}

    const runAutomation = () => {
        const runUrl = `https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/jira/run?JiraIssueType=${issueType}&JiraIssueKey=${issueKey}&FullError=false`;
        return fetchWithTimeout(runUrl, 300000)
        .then(async (response) => {
			const bodyText = await response.text(); let bodyJson = null;
      		try { bodyJson = bodyText ? JSON.parse(bodyText) : null; } catch {}
			if (!response.ok) {
				const error = new Error(`HTTP ${response.status} ${response.statusText || ""}`.trim());
				error.status = response.status; error.statusText = response.statusText;
				error.body = bodyJson ?? bodyText; throw error;
			}
			return bodyJson ?? bodyText;
        })
        .then((data) => {
            messageBox.innerText = `${JSON.stringify(data, null, 2)}`;
			return data;
        });
    };

    const typeUrl = `https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/jira/type?JiraIssueKey=${issueKey}&FullError=false`;
    fetchWithTimeout(typeUrl, 15000)
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
            activeButton.addEventListener("click", () => {
				runAutomation().catch((error) => {
                    console.error("Caught error in runAutomation:", error);
					const details = typeof error.body === "string" ? error.body 
										: (error.body ? JSON.stringify(error.body, null, 2) : error.message);
					messageBox.innerText = `Error ${error.status || ""} ${error.statusText || ""}\n${details}`;
                });
            });
        }
    })
    .catch((error) => {
        console.error("Caught error in /type fetch:", error);
        messageBox.innerText = "Test Automation is accessible only from the corporate network. (on-site or via VPN)" + error.message;
    });
}
document.addEventListener("DOMContentLoaded", attachScriptRunnerButtonListener);
