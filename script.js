async function attachScriptRunnerButtonListener() {
    const buttonPlan = document.getElementById("run-test-plan-script");
    const buttonExecution = document.getElementById("run-test-execution-script");
    const messageBox = document.getElementById("script-response-message");
    const issueKey = window.AdaptavistBridgeContext?.context?.issueKey;
    let issueType = "";

    if (!buttonPlan || !buttonExecution || !messageBox) {
        setTimeout(attachScriptRunnerButtonListener, 200); return;
    }
    buttonPlan.style.display = "none"; buttonExecution.style.display = "none";
	const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    /*TO DELETE*/if (!["QA-62750", "QA-62632", "QA-45036"].includes(issueKey)) { return; }

	function fetchWithTimeout(url, timeout) {
		const controller = new AbortController();
		const tid = setTimeout(() => controller.abort(), timeout);
		return fetch(url, { method: "GET", signal: controller.signal }).finally(() => clearTimeout(tid));
	}
	try {
		const pingResp = await fetchWithTimeout(`https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/ping`, 2500);
		if (!pingResp.ok) throw new Error(`HTTP ${pingResp.status}`);
		const pingData = await pingResp.json();
	} catch (error) {
		console.error("Caught error during initial /ping:", error);
		messageBox.innerText = "Test Automation Service Connecting ..."; await sleep(2000); 
		messageBox.innerText =
		error.message === "Failed to fetch"
			? "Test Automation is accessible only from the corporate network. (on-site or via VPN)"
			: "Test Automation Service is Offline: Please contact SVT Admin group";
		return; 
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
    fetchWithTimeout(typeUrl, 300000)
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
				messageBox.innerText = "Test Automation Service is Online"
                activeButton = buttonPlan; break;   
            case "TestExecution":
                buttonExecution.style.display = "block";
				messageBox.innerText = "Test Automation Service is Online"
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
        messageBox.innerText = "Test Automation Process Error (" + error.message + ") Please contact SVT admin group";
    });
}
document.addEventListener("DOMContentLoaded", attachScriptRunnerButtonListener);
