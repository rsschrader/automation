async function attachScriptRunnerButtonListener() {
    const buttonPlan = document.getElementById("run-test-plan-script");
    const buttonExecution = document.getElementById("run-test-execution-script");
    const messageBox = document.getElementById("script-response-message");
    const issueKey = window.AdaptavistBridgeContext?.context?.issueKey;
    let issueType = "";

	/*TO DELETE*/if (!["QA-62750", "QA-62632", "QA-45036"].includes(issueKey)) { return; }

    if (!buttonPlan || !buttonExecution || !messageBox) {
        setTimeout(attachScriptRunnerButtonListener, 200); return;
    }
    buttonPlan.style.display = "none"; buttonExecution.style.display = "none";
	messageBox.innerText = "Test Automation Service Connecting ..."; 

	const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
	function fetchWithTimeout(url, timeout) {
		const controller = new AbortController();
		const tid = setTimeout(() => controller.abort(), timeout);
		return fetch(url, { method: "GET", signal: controller.signal }).finally(() => clearTimeout(tid));
	}




	if (buttonPlan) {
		buttonPlan.style.display = "block"; 
	  	buttonPlan.addEventListener("click", async function () {
	    messageBox.innerText = ">> Fetching public IP...";
	    messageBox.style.color = "black";
	
	    try {

	
	      // 1. Get the public IP
	      const ipRes = await fetchWithTimeout("https://api.ipify.org?format=json", 5000);
	      if (!ipRes.ok) throw new Error(`IP API failed: ${ipRes.status}`);
	
	      const ipData = await ipRes.json();
	      const ip = ipData?.ip;
	      if (!ip) throw new Error("No IP address returned");
	
	      // Show IP while fetching org info
	      messageBox.innerText = `IP: ${ip} - Fetching organization info...`;
	
	      // 2. Get organization info for that IP
	      const orgRes = await fetchWithTimeout(`https://ipinfo.io/${ip}/org`, 5000);
	      if (!orgRes.ok) throw new Error(`Org API failed: ${orgRes.status}`);
	
	      const org = await orgRes.text();
	
	      // 3. Display final result
	      messageBox.innerText = `IP: ${ip} - Org: ${org}`;
	    } catch (err) {
	      console.error("Error fetching IP or Org:", err);
	      messageBox.innerText = `Fetch error: ${err.message}`;
	      messageBox.style.color = "red";
	    }
	  });
	}

	return;




	try {
		const pingResp = await fetchWithTimeout(`https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/ping`, 5000);
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
