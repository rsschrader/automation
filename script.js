function getIssueKeyFromUrl() {
  const match = window.location.pathname.match(/([A-Z]+-\d+)/);
  return match ? match[1] : null;
}

async function attachScriptRunnerButtonListener() {
  const statusButton = document.getElementById("run-status-button");
  const runButton = document.getElementById("run-dynamic-button");
  const box = document.getElementById("status-box");
  const progressContainer = document.getElementById("progress-container");
  const progressBar = document.getElementById("progress-bar");
  const panelRoot = document.querySelector(".scroll-wrapper");

  const issueKey = getIssueKeyFromUrl();
  const issueType = "TestExecution";
  let sourceInfo = "";
/*
  try {
    const ipResponse = await fetchWithTimeout("https://api.ipify.org?format=json", 5000);
    if (!ipResponse.ok) throw new Error(`IP API failed: ${ipResponse.status}`);

    const ipData = await ipResponse.json();
    const sourceIp = ipData?.ip;
    if (!sourceIp) throw new Error("No IP address returned");

    const orgResponse = await fetchWithTimeout(`https://ipinfo.io/${sourceIp}/org`, 5000);
    if (!orgResponse.ok) throw new Error(`Org API failed: ${orgResponse.status}`);

    const sourceOrg = await orgResponse.text();
    sourceInfo = `IP: ${sourceIp} - Org: ${sourceOrg}`;
  } catch (error) {
    console.error("Error fetching IP or Org:", error);
    sourceInfo = `IP: ***.***.***.*** - Org: Not Available`;
  }

  try {
    const pingResp = await fetchWithTimeout(
      `https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/ping?SourceInfo=${sourceInfo}`,
      5000
    );
    if (!pingResp.ok) throw new Error(`HTTP ${pingResp.status}`);
    await pingResp.json();
  } catch (error) {
    console.error("Caught error during initial /ping:", error);
    await sleep(2000);
    box.classList.remove("hidden");
    box.innerText =
      error.message === "Failed to fetch"
        ? "Test Automation is accessible only from the corporate network. (on-site or via VPN)"
        : "Test Automation Service is Offline: Please contact SVT Admin group";
    return;
  }

  try {
    const typeResponse = await fetchWithTimeout(
      `https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/jira/type?JiraIssueKey=${issueKey}&FullError=false`,
      300000
    );
    const typeData = await typeResponse.json();
    const issueTypeResolved = (typeData.fields?.issuetype?.name || "").replace(/ /g, "");
    console.log("Resolved IssueType:", issueTypeResolved);
  } catch (error) {
    console.warn("Issue type fetch failed");
  }
*/
  switch (issueType) {
    case "TestPlan":
      runButton.innerText = "Run TestPlan TestExecutions";
      showRow(panelRoot, [statusButton, runButton]);
      box.classList.remove("hidden");
      box.innerText = "Test Automation Service is Online";
      break;

    case "TestExecution":
      runButton.innerText = "Run TestExecution XrayTests";
      showRow(panelRoot, [statusButton, runButton]);
      box.classList.remove("hidden");
      box.innerText = "Test Automation Service is Online";
      break;

    default:
      showRow(panelRoot, [statusButton, runButton]);
      box.classList.remove("hidden");
      box.innerText = "Test Automation is accessible only from TestPlans or TestExecutions";
  }

  statusButton.addEventListener("click", () => {
    runButton.disabled = false;
    setProgress(0);

    box.classList.remove("hidden");
    box.innerText = `IssueKey = ${issueKey} IssueType = ${issueType}\n\n`;

    const items =
      issueType === "TestPlan"
        ? [
            { execution: "QA-4", tests: 2 },
            { execution: "QA-16", tests: 2 },
            { execution: "QA-17", tests: 2 },
          ]
        : [
            { test: "QA-101", summary: "Login Test" },
            { test: "QA-102", summary: "Search Test" },
            { test: "QA-103", summary: "Booking Flow Test" },
          ];

    let pct = 0;
    let idx = 0;

    const interval = setInterval(() => {
      pct += 20;
      if (pct > 100) pct = 100;
      setProgress(pct);

      if (idx < items.length) {
        const item = items[idx++];
        box.innerText += issueType === "TestPlan" ? `Execution ${idx}: ${item.execution} running ${item.tests} tests...\n`: `Test ${idx}: ${item.test} - ${item.summary} running...\n`;
        box.scrollTop = box.scrollHeight;
      }

      if (pct === 100) {
        clearInterval(interval);
        box.innerText += "\nAll finished!\n";
        runButton.disabled = false;
      }
    }, 700);
  });

  runButton.addEventListener("click", () => {
    box.innerText = `Run button clicked IssueKey = ${issueKey}\nReady to wire real /run logic`;
  });

  function setProgress(pct) {
    progressContainer.classList.remove("hidden");
    progressBar.style.width = pct + "%";
    progressBar.innerText = pct + "%";
  }

  function fetchWithTimeout(url, timeout) {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), timeout);
    return fetch(url, { method: "GET", signal: controller.signal }).finally(() =>
      clearTimeout(tid)
    );
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function hideRow(rowElement, btnElements) {
    (btnElements || []).forEach(btn => {
      btn.hidden = true;
      btn.style.setProperty("display", "none", "important");
    });
    rowElement.hidden = true;
    rowElement.setAttribute("aria-hidden", "true");
    rowElement.classList.add("sr-hide");
    rowElement.style.setProperty("display", "none", "important");
  }

  function showRow(rowElement, btnElements) {
    rowElement.hidden = false;
    rowElement.removeAttribute("aria-hidden");
    rowElement.classList.remove("sr-hide");
    rowElement.style.setProperty("display", "block", "important");
    (btnElements || []).forEach(btn => {
      btn.hidden = false;
      btn.style.display = "inline-flex";
    });
  }
}
document.addEventListener("DOMContentLoaded", attachScriptRunnerButtonListener);
