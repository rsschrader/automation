function getIssueKeyFromUrl() {
    const match = window.location.pathname.match(/([A-Z]+-\d+)/);
    return match ? match[1] : null;
}
async function attachScriptRunnerButtonListener() {
  const statusButton = document.getElementById("run-status-button");
  const runButton    = document.getElementById("run-dynamic-button");
  const box1 = document.getElementById("status-box-1");
  const box2 = document.getElementById("status-box-2");
  const box3 = document.getElementById("status-box-3");
  const progressContainer = document.getElementById("progress-container");
  const progressBar = document.getElementById("progress-bar");
  const issueKey = getIssueKeyFromUrl();
  let issueType = ""; let sourceInfo = "";
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
  }catch (error) {
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
  }
  try {
	  const typeResponce = await fetchWithTimeout(`https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/jira/type?JiraIssueKey=${issueKey}&FullError=false`, 300000);
  	  const typeData = await typeResponce.json();
  	  issueType = (typeData.fields?.issuetype?.name || "").replace(/ /g, "");
  	  console.log("Resolved IssueType:", issueType);
  } catch (error) {
	  error.message === "Failed to fetch"
			? "issuetype not fetched"
			: "Test Automation Service is Offline: Please contact SVT Admin group";
  }
  
  switch (issueType) {
		  case "TestPlan":
                runButton.innerText = "Run TestPlan TestExecutions";
		  		box1.classList.remove("hidden");
                box1.innerText = "Test Automation Service is Online"; break;   
      	  case "TestExecution":
                runButton.innerText = "Run TestExecution XrayTests"; 
		  		box1.classList.remove("hidden");
                box1.innerText = "Test Automation Service is Online"; break;
          default:
		  		box1.classList.remove("hidden");
                box1.innerText = "Test Automation is accessible only from TestPlans or TestExecutions";
  }
  statusButton.addEventListener("click", () => {
    runButton.disabled = true;
    setProgress(0);
    box1.classList.remove("hidden");
    box2.classList.remove("hidden");
    box3.classList.remove("hidden");
    box1.innerText = `IssueKey = ${issueKey} IssueType = ${issueType}`;
    box2.innerText = "";
    box3.innerText = "";
    const items = issueType === "TestPlan"
      ? [
          { execution: "QA-4", tests: 2 },
          { execution: "QA-16", tests: 2 },
          { execution: "QA-17", tests: 2 }
        ]
      : [
          { test: "QA-101", summary: "Login Test" },
          { test: "QA-102", summary: "Search Test" },
          { test: "QA-103", summary: "Booking Flow Test" }
        ];
 
    let pct = 0;
    let idx = 0;
 
    const interval = setInterval(() => {
      pct += 20;
      if (pct > 100) pct = 100;
      setProgress(pct);
 
      if (idx < items.length) {
        const item = items[idx++];
        box2.innerText += issueType === "TestPlan" ? `Execution ${idx}: ${item.execution} running ${item.tests} tests...\n` : `Test ${idx}: ${item.test} - ${item.summary} running...\n`;
        box2.scrollTop = box2.scrollHeight;
      }
 
      if (pct === 100) {
        clearInterval(interval);
        box2.innerText += "All finished!\n";
        box3.innerText = `Final Fake Response:\n${JSON.stringify(items, null, 2)}`;
        runButton.disabled = false;
      }
    }, 700);
  });
 
  runButton.addEventListener("click", () => {
    box1.innerText = `Run button clicked IssueKey = ${issueKey}`;
    box2.innerText = "Ready to wire real /run logic";
    box3.innerText = "Placeholder response";
  });
  function setProgress(pct) {
    progressContainer.classList.remove("hidden");
    progressBar.style.width = pct + "%";
    progressBar.innerText = pct + "%";
  }
  function fetchWithTimeout(url, timeout) {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), timeout);
      return fetch(url, { method: "GET", signal: controller.signal }).finally(() => clearTimeout(tid));
  }
}
 
document.addEventListener("DOMContentLoaded", attachScriptRunnerButtonListener);
