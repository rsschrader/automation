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
  const issueKey = "QA-62751";
  const issueType = "TestExecution";  
  //const issueType = "TestPlan"; 
  let issueKey1 = getIssueKeyFromUrl();

  //temporary replacement for switch(issuetype) 
  statusButton.innerText = "Run Status";
  runButton.innerText = issueType === "TestPlan" ? "Run TestPlan TestExecutions" : "Run TestExecution XrayTests";

  box1.classList.remove("hidden");
  box1.innerText = "Test Automation Service is Online";

  statusButton.addEventListener("click", () => {
    runButton.disabled = true;
    setProgress(0);
    box1.classList.remove("hidden");
    box2.classList.remove("hidden");
    box3.classList.remove("hidden");
    box1.innerText = `Init: IssueKey = ${issueKey} IssueType = ${issueType}`;
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
}

document.addEventListener("DOMContentLoaded", attachScriptRunnerButtonListener);
