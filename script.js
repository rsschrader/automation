// =======================
// ScriptRunner Fragment JS
// =======================

// ---- helpers (top-level) ----
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function getIssueKeySafe() {
  // URL path: /browse/QA-62751
  //const pathMatch = window.location.pathname.match(/\/browse\/([A-Z]+-\d+)/);
  const pathMatch = window.location.pathname.match(/([A-Z]+-\d+)/);
  if (pathMatch) return pathMatch[0];

  // URL query: ?issueKey=QA-62751
  //const queryMatch = window.location.search.match(/[?&]issueKey=([A-Z]+-\d+)/);
  //if (queryMatch) return queryMatch[1];

  return null;
}

async function waitForIssueKey({ timeoutMs = 8000, pollMs = 150 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const key = window.AdaptavistBridgeContext?.context?.issueKey;
    if (key) return key;
    await sleep(pollMs);
  }
  return null; // timed out
}
let __cachedIssueKey = null;

async function resolveIssueKeyWithRetry() {
  if (__cachedIssueKey) return __cachedIssueKey;

  for (let i = 0; i < 20; i++) {
    const key = getIssueKeySafe();
    if (key) {
      __cachedIssueKey = key;
      console.log("ScriptRunner issueKey:", key);
      return key;
    }
    await sleep(150);
  }

  console.error("ScriptRunner: Unable to resolve issueKey");
  return null;
}


let __srInitialized = false;

async function attachScriptRunnerButtonListener() {
  // Prevent double init (Jira can re-render fragments)
  if (__srInitialized) return;

  // Wait for ScriptRunner context FIRST (issueKey is injected async)
  //const issueKey = await waitForIssueKey({ timeoutMs: 12000, pollMs: 150 });
  //if (!issueKey) {
  //  console.error("ScriptRunner: issueKey not available (timed out). Are you on an Issue view?");
  //  return;
  //}
  const issueKey = __cachedIssueKey || await resolveIssueKeyWithRetry();
  if (!issueKey) return;  
  alert("ScriptRunner loaded. IssueKey = " + issueKey);
  console.log("ScriptRunner issueKey:", issueKey);
  fetch("https://localhost/api/v1/ping")
    .then((r) => {
      console.log("Localhost ping status:", r.status);
      return r.text();
    })
    .then((t) => {
      console.log("Localhost ping response:", t);
    })
    .catch((e) => {
      console.error("Localhost ping failed:", e.message);
    });

  // 2) Public CORS-enabled API (expected to WORK)
  fetch("https://api.github.com")
    .then((r) => {
      console.log("GitHub status:", r.status);
      return r.json();
    })
    .then((j) => {
      console.log("GitHub OK, keys:", Object.keys(j));
    })
    .catch((e) => {
      console.error("GitHub fetch failed:", e.message);
    });

  // 3) Public site without CORS headers (expected to FAIL)
  fetch("https://www.wikipedia.org")
    .then((r) => {
      console.log("Wikipedia status:", r.status);
      return r.text();
    })
    .then((t) => {
      console.log("Wikipedia response length:", t.length);
    })
    .catch((e) => {
      console.error("Wikipedia fetch failed:", e.message);
    });


  // Then wait for your DOM to exist
  const panelPlan = document.getElementById("actions-plan");
  const statusPlan = document.getElementById("run-test-plan-status");
  const buttonPlan = document.getElementById("run-test-plan-button");

  const panelExecution = document.getElementById("actions-execution");
  const statusExecution = document.getElementById("run-test-execution-status");
  const buttonExecution = document.getElementById("run-test-execution-button");

  const messageBox = document.getElementById("script-response-message");

  if (
    !panelPlan || !statusPlan || !buttonPlan ||
    !panelExecution || !statusExecution || !buttonExecution ||
    !messageBox
  ) {
    // DOM not ready yet (or fragment not rendered yet) -> retry
    //setTimeout(attachScriptRunnerButtonListener, 200);
    return;
  }

  // Mark as initialized only once we have BOTH context + DOM
  __srInitialized = true;

  let issueType = "";
  let sourceInfo = "";

  /*TO DELETE*/
  if (!["QA-62750", "QA-62632", "QA-62751", "QA-45036", "QA-62914", "QA-62623", "QA-62624"].includes(issueKey)) {
    return;
  }

  messageBox.innerText = "Test Automation Service Connecting ...";
  hideRow(panelPlan, [statusPlan, buttonPlan]);
  hideRow(panelExecution, [statusExecution, buttonExecution]);

  function fetchWithTimeout(url, timeout) {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), timeout);
    return fetch(url, { method: "GET", signal: controller.signal }).finally(() => clearTimeout(tid));
  }

  // IMPORTANT: SourceInfo must be URL-encoded (you were sending spaces/colons raw)
  function toQueryParam(s) {
    return encodeURIComponent(String(s ?? ""));
  }

  // --- fetch IP + org (best effort) ---
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
    sourceInfo = "IP: ***.***.***.*** - Org: Not Available";
  }

  // --- ping service ---
  try {
    const pingUrl = `https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/jira/ping?SourceInfo=${toQueryParam(sourceInfo)}`;
    const pingResp = await fetchWithTimeout(pingUrl, 5000);
    if (!pingResp.ok) throw new Error(`HTTP ${pingResp.status}`);
    await pingResp.json().catch(() => null);
  } catch (error) {
    console.error("Caught error during initial /ping:", error);
    await sleep(2000);
    messageBox.innerText =
      error.message === "Failed to fetch"
        ? "Test Automation is accessible only from the corporate network. (on-site or via VPN)"
        : "Test Automation Service is Offline: Please contact SVT Admin group";
    return;
  }

  const runStatus = () => {
    messageBox.innerText = "Test Automation Status ...";
    const runUrl = `https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/jira/status?JiraIssueType=${issueType}&JiraIssueKey=${issueKey}&FullError=false`;
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
        const summary = buildSummary(`${JSON.stringify(data, null, 2)}`);
        messageBox.innerText = `${summary}\n\n${JSON.stringify(data, null, 2)}`;
        return data;
      });
  };

  const runAutomation = () => {
    messageBox.innerText = "Test Automation Processing ...";
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
        messageBox.innerText = `${JSON.stringify(data, null, 2)}`;
        return data;
      });
  };

  // --- determine issue type and bind correct buttons ---
  const typeUrl = `https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/jira/type?JiraIssueKey=${issueKey}&FullError=false`;

  fetchWithTimeout(typeUrl, 300000)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      issueType = (data.fields?.issuetype?.name || "").replace(/ /g, "");

      let statusButton = null;
      let activeButton = null;

      switch (issueType) {
        case "TestPlan":
          showRow(panelPlan, [statusPlan, buttonPlan]);
          statusButton = statusPlan;
          activeButton = buttonPlan;
          messageBox.innerText = "Test Automation Service is Online. Plan";
          break;

        case "TestExecution":
          showRow(panelExecution, [statusExecution, buttonExecution]);
          statusButton = statusExecution;
          activeButton = buttonExecution;
          messageBox.innerText = "Test Automation Service is Online. Executions";
          break;

        default:
          messageBox.innerText = "Test Automation is accessible only from TestPlans or TestExecutions";
      }

      // Bind once per element
      if (statusButton && !statusButton.dataset.bound) {
        statusButton.dataset.bound = "1";
        statusButton.addEventListener("click", () => {
          runStatus().catch((error) => {
            console.error("Caught error in runStatus:", error);
            const details =
              typeof error.body === "string"
                ? error.body
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
            const details =
              typeof error.body === "string"
                ? error.body
                : (error.body ? JSON.stringify(error.body, null, 2) : error.message);
            messageBox.innerText = `Error ${error.status || ""} ${error.statusText || ""}\n${details}`;
          });
        });
      }
    })
    .catch((error) => {
      console.error("Caught error in /type fetch:", error);
      messageBox.innerText =
        "Test Automation Process Error (" + error.message + ") Please contact SVT admin group";
    });

  // ---- existing helpers (unchanged) ----
  function buildSummary(raw) {
    const arr = normalizeToArray(raw);
    const order = ["TO DO", "IN PROGRESS", "PASSED", "FAILED"];
    const counts = Object.fromEntries(order.map((s) => [s, 0]));

    for (const exec of arr) {
      const runs = Array.isArray(exec?.TestRunsJiraKeys) ? exec.TestRunsJiraKeys : [];
      for (const run of runs) {
        const norm = normalizeStatus(run?.TestStatus);
        if (norm && norm in counts) counts[norm] += 1;
      }
    }
    const line1 = `Test Execution [${arr.length}]`;
    const line2 = order.map((s) => `${s} [${counts[s]}]`).join("   ");
    return `${line1}\n\n${line2}`;
  }

  function normalizeToArray(raw) {
    if (typeof raw === "string") {
      try { raw = JSON.parse(raw); } catch { return []; }
    }
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object" && "TestExecutionJiraKey" in raw) return [raw];
    for (const k of ["data", "value", "results", "items"]) {
      if (Array.isArray(raw?.[k])) return raw[k];
    }
    return [];
  }

  function normalizeStatus(s) {
    const t = String(s || "").trim().toUpperCase().replace(/\s+/g, " ");
    if (t === "TO DO" || t === "TO_DO" || t === "TODO") return "TO DO";
    if (t === "IN PROGRESS" || t === "IN_PROGRESS") return "IN PROGRESS";
    if (t === "PASSED" || t === "PASS") return "PASSED";
    if (t === "FAILED" || t === "FAIL") return "FAILED";
    return "";
  }

  function showRow(rowElement, btnElements) {
    rowElement.hidden = false;
    rowElement.removeAttribute("aria-hidden");
    rowElement.classList.remove("hidden", "aui-hide", "sr-hidden", "sr-hide");
    rowElement.style.setProperty("display", "flex", "important");
    rowElement.style.flexDirection = "row";
    rowElement.style.alignItems = "center";
    rowElement.style.flexWrap = "wrap";
    rowElement.style.gap = "8px";
    (btnElements || []).forEach((btnElement) => {
      btnElement.hidden = false;
      btnElement.style.display = "inline-flex";
      btnElement.style.flex = "0 0 auto";
      btnElement.style.width = "auto";
    });
  }

  function hideRow(rowElement, btnElements) {
    (btnElements || []).forEach((btnElement) => {
      btnElement.hidden = true;
      btnElement.style.setProperty("display", "none", "important");
    });
    rowElement.hidden = true;
    rowElement.setAttribute("aria-hidden", "true");
    rowElement.classList.add("sr-hide");
    rowElement.style.setProperty("display", "none", "important");
  }
}

// DOM ready -> start init
document.addEventListener("DOMContentLoaded", attachScriptRunnerButtonListener);

// OPTIONAL: In Jira Cloud, some fragments render after DOMContentLoaded.
// If you still see missed init sometimes, uncomment this:
// setTimeout(attachScriptRunnerButtonListener, 0);
