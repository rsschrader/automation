// Call immediately if DOM is already ready; otherwise on DOMContentLoaded
(function () {
  const go = () => attachScriptRunnerButtonListener().catch(console.error);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", go);
  } else {
    go();
  }
})();

async function attachScriptRunnerButtonListener() {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // Retry until required elements exist
  let buttonPlan, buttonExecution, messageBox;
  for (let i = 0; i < 50; i++) {
    buttonPlan = document.getElementById("run-test-plan-button");
    buttonExecution = document.getElementById("run-test-execution-button");
    messageBox = document.getElementById("script-response-message");
    if (buttonPlan && buttonExecution && messageBox) break;
    await sleep(200);
  }
  if (!buttonPlan || !buttonExecution || !messageBox) {
    console.warn("Buttons or message box not found.");
    return;
  }

  // Wait for Adaptavist issueKey to appear
  let issueKey;
  for (let i = 0; i < 50; i++) {
    issueKey = window.AdaptavistBridgeContext?.context?.issueKey;
    if (issueKey) break;
    await sleep(200);
  }

  // REMOVE or move this guard AFTER issueKey is available
  // If you keep it, at least show a message instead of silently returning.
  // if (issueKey && !["QA-62750", "QA-62632", "QA-45036"].includes(issueKey)) {
  //   messageBox.innerText = "This helper only runs for allowed issues.";
  //   return;
  // }

  // Start UI
  buttonPlan.hidden = true;
  buttonExecution.hidden = true;
  messageBox.innerText = "Test Automation Service Connecting ...";

  function fetchWithTimeout(url, timeout) {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), timeout);
    return fetch(url, { method: "GET", signal: controller.signal })
      .finally(() => clearTimeout(tid));
  }

  // --- Optional: IP + Org (surrounded with try/catch; safe fallback) ---
  let sourceInfo = "";
  try {
    const ipRes = await fetchWithTimeout("https://api.ipify.org?format=json", 5000);
    if (!ipRes.ok) throw new Error(`IP API failed: ${ipRes.status}`);
    const ip = (await ipRes.json())?.ip;
    if (!ip) throw new Error("No IP address returned");

    const orgRes = await fetchWithTimeout(`https://ipinfo.io/${ip}/org`, 5000);
    if (!orgRes.ok) throw new Error(`Org API failed: ${orgRes.status}`);
    const org = (await orgRes.text()).trim();

    sourceInfo = `IP: ${ip} - Org: ${org}`;
  } catch (e) {
    console.warn("IP/Org lookup failed (non-fatal):", e);
    sourceInfo = "IP: ***.***.***.*** - Org: Not Available";
  }

  // --- Ping (NOTE: encode param!) ---
  try {
    const pingUrl = `https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/ping?SourceInfo=${encodeURIComponent(sourceInfo)}`;
    const pingResp = await fetchWithTimeout(pingUrl, 5000);
    if (!pingResp.ok) throw new Error(`HTTP ${pingResp.status}`);
    await pingResp.json(); // not used, but validates JSON
  } catch (error) {
    console.error("Caught error during initial /ping:", error);
    await sleep(2000);
    messageBox.innerText =
      error.message === "Failed to fetch"
        ? "Test Automation is accessible only from the corporate network. (on-site or via VPN)"
        : "Test Automation Service is Offline: Please contact SVT Admin group";
    return; // stop wiring if ping failed
  }

  // --- Run helper ---
  const runAutomation = () => {
    const issueType = messageBox.dataset.issueType || ""; // gets set below
    const runUrl = `https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/jira/run?JiraIssueType=${issueType}&JiraIssueKey=${issueKey}&FullError=false`;
    return fetchWithTimeout(runUrl, 300000)
      .then(async (response) => {
        const bodyText = await response.text();
        let bodyJson = null;
        try { bodyJson = bodyText ? JSON.parse(bodyText) : null; } catch {}
        if (!response.ok) {
          const err = new Error(`HTTP ${response.status} ${response.statusText || ""}`.trim());
          err.status = response.status;
          err.statusText = response.statusText;
          err.body = bodyJson ?? bodyText;
          throw err;
        }
        return bodyJson ?? bodyText;
      })
      .then((data) => {
        messageBox.innerText = JSON.stringify(data, null, 2);
        // auto-scroll only the message panel if it's scrollable
        messageBox.scrollTop = messageBox.scrollHeight;
        return data;
      });
  };

  // --- Determine issue type and wire buttons ---
  try {
    const typeUrl = `https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/jira/type?JiraIssueKey=${issueKey}&FullError=false`;
    const resp = await fetchWithTimeout(typeUrl, 300000);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    const issueType = (data.fields?.issuetype?.name || "").replace(/ /g, "");
    messageBox.dataset.issueType = issueType;

    let activeButton = null;
    switch (issueType) {
      case "TestPlan":
        buttonPlan.hidden = false; // IMPORTANT: clear hidden attribute
        messageBox.innerText = "Test Automation Service is Online";
        activeButton = buttonPlan;
        break;
      case "TestExecution":
        buttonExecution.hidden = false; // IMPORTANT
        messageBox.innerText = "Test Automation Service is Online";
        activeButton = buttonExecution;
        break;
      default:
        messageBox.innerText =
          "Test Automation is accessible only from TestPlans or TestExecutions";
    }

    if (activeButton && !activeButton.dataset.bound) {
      activeButton.dataset.bound = "1";
      activeButton.addEventListener("click", () => {
        runAutomation().catch((error) => {
          console.error("Caught error in runAutomation:", error);
          const details =
            typeof error.body === "string"
              ? error.body
              : error.body
              ? JSON.stringify(error.body, null, 2)
              : error.message;
          messageBox.innerText = `Error ${error.status || ""} ${error.statusText || ""}\n${details}`;
        });
      });
    }
  } catch (error) {
    console.error("Caught error in /type fetch:", error);
    messageBox.innerText =
      "Test Automation Process Error (" + error.message + ") Please contact SVT admin group";
  }
}
