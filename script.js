function attachScriptRunnerButtonListener() {
  const statusButton = document.getElementById("run-status-button");
  const runButton    = document.getElementById("run-dynamic-button");
  const box1         = document.getElementById("status-box-1");

  statusButton.innerText = "Run Status";
  runButton.innerText    = "Run TestExecution XrayTests";
  runButton.disabled     = false;
    
  box1.classList.remove("hidden");
  box1.innerText = "Test Automation Service is Online";
    
  statusButton.addEventListener("click", () => {
    box1.innerText = `Init: IssueKey = QA-62751`;
  });
    
  runButton.addEventListener("click", () => {
    box1.innerText = "Run button clicked";
  });
}
document.addEventListener("DOMContentLoaded", attachScriptRunnerButtonListener);
