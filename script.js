function getIssueKeyFromUrl() {
  const match = window.location.pathname.match(/([A-Z]+-\d+)/);
  return match ? match[1] : null;
}
async function attachScriptRunnerButtonListener() {
  const statusButton = document.getElementById("run-status-button");
  const runButton    = document.getElementById("run-dynamic-button");
  const box = document.getElementById("status-box");
  const progressContainer = document.getElementById("progress-container");
  const progressBar  = document.getElementById("progress-bar");

  const issueKey = getIssueKeyFromUrl();
  const issueType = "TestExecution";

  box.classList.remove("hidden");
  box.innerText = issueKey ? `IssueKey detected: ${issueKey} : "IssueKey not found in URL";
  runButton.innerText = "Run TestExecution XrayTests";
  runButton.disabled = false;

  statusButton.addEventListener("click", () => {
    runButton.disabled = true;
    setProgress(0);

    box.innerText = `IssueKey = ${issueKey}\nIssueType = ${issueType}\n\n`;

    const items = [
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
        box.innerText += `Test ${idx}: ${item.test} - ${item.summary} running...\n`;
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
    box.innerText = `Run button clicked\nIssueKey = ${issueKey}\nReady for real integration`;
  });

  function setProgress(pct) {
    progressContainer.classList.remove("hidden");
    progressBar.style.width = pct + "%";
    progressBar.innerText = pct + "%";
  }
}

document.addEventListener("DOMContentLoaded", attachScriptRunnerButtonListener);
