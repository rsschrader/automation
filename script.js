async function attachScriptRunnerButtonListener() {
    const panelPlan = document.getElementById('actions-plan');
    const statusPlan = document.getElementById("run-test-plan-status");
    const buttonPlan = document.getElementById("run-test-plan-button");
    const panelExecution = document.getElementById('actions-execution');
    const statusExecution = document.getElementById("run-test-execution-status");
    const buttonExecution = document.getElementById("run-test-execution-button");
    const messageBox = document.getElementById("script-response-message");
    const issueKey = window.AdaptavistBridgeContext?.context?.issueKey;
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    let issueType = ""; let sourceInfo = "";

    if (!panelPlan || !statusPlan || !buttonPlan || !panelExecution || !statusExecution || !buttonExecution || !messageBox || !issueKey) {
        setTimeout(attachScriptRunnerButtonListener, 200); return;
    }
    function showPanel(panelItems) { 
        if (panelItems) {
            panelItems.style.display = 'flex'; 
        }
    }
    function hidePanel(panelItems) { 
        if (panelItems) {
            panelItems.style.display = 'none'; 
        }
    }
    hidePanel(panelPlan); hidePanel(panelExecution);

	/*TO DELETE*/if (!["QA-62750", "QA-62632", "QA-45036"].includes(issueKey)) { return; }
	
    messageBox.innerText = "Test Automation Service Connecting ..."; 
	function fetchWithTimeout(url, timeout) {
		const controller = new AbortController();
		const tid = setTimeout(() => controller.abort(), timeout);
		return fetch(url, { method: "GET", signal: controller.signal }).finally(() => clearTimeout(tid));
	}

	try {
		const ipResponce = await fetchWithTimeout("https://api.ipify.org?format=json", 5000);
		if (!ipResponce.ok) throw new Error(`IP API failed: ${ipResponce.status}`);
		const ipData = await ipResponce.json();
		const sourceIp = ipData?.ip;
		if (!sourceIp) throw new Error("No IP address returned");
		const orgResponce = await fetchWithTimeout(`https://ipinfo.io/${sourceIp}/org`, 5000);
		if (!orgResponce.ok) throw new Error(`Org API failed: ${orgResponce.status}`);
		const sourceOrg = await orgResponce.text();
		sourceInfo = `IP: ${sourceIp} - Org: ${sourceOrg}`;
	} catch (error) {
		console.error("Error fetching IP or Org:", error);
		sourceInfo = `IP: ***.***.***.*** - Org: Not Available`
	}

	try {
		const pingResp = await fetchWithTimeout(`https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/ping?SourceInfo=${sourceInfo}`, 5000);
		if (!pingResp.ok) throw new Error(`HTTP ${pingResp.status}`);
		const pingData = await pingResp.json();
	} catch (error) {
		console.error("Caught error during initial /ping:", error);
		await sleep(2000); messageBox.innerText =
		error.message === "Failed to fetch"
			? "Test Automation is accessible only from the corporate network. (on-site or via VPN)"
			: "Test Automation Service is Offline: Please contact SVT Admin group";
		return; 
	}

    const runStatus = () => {
        const runUrl = `https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/jira/status?JiraIssueType=${issueType}&JiraIssueKey=${issueKey}&FullError=false`;
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
        let statusButton = null; let activeButton = null; 
        switch (issueType) {
            case "TestPlan":
                showPanel(panelPlan); 
                statusButton = statusPlan; activeButton = buttonPlan; 
                messageBox.innerText = "Test Automation Service is Online. Plan"; break;   
            case "TestExecution":
                showPanel(panelExecution); 
                statusButton = statusExecution; activeButton = buttonExecution; 
                messageBox.innerText = "Test Automation Service is Online. Executions"; break;
            default:
                messageBox.innerText = "Test Automation is accessible only from TestPlans or TestExecutions";
        }
        if (statusButton && !statusButton.dataset.bound) {
            statusButton.dataset.bound = "1";
            statusButton.addEventListener("click", () => {
				runStatus().catch((error) => {
                    console.error("Caught error in runStatus:", error);
					const details = typeof error.body === "string" ? error.body 
										: (error.body ? JSON.stringify(error.body, null, 2) : error.message);
					messageBox.innerText = `Error ${error.status || ""} ${error.statusText || ""}\n${details}`;
                });
            });
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
