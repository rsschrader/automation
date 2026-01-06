async function attachScriptRunnerButtonListener() {
    const statusButton = document.getElementById("run-status-button");
    const runButton    = document.getElementById("run-dynamic-button");
    const messageBox1  = document.getElementById("status-box-1");
    const messageBox2  = document.getElementById("status-box-2");
    const messageBox3  = document.getElementById("status-box-3");
    const progressContainer = document.getElementById("progress-container");
    const progressBar = document.getElementById("progress-bar");

    // ScriptRunner can re-render → wait for DOM
    if (!statusButton || !runButton || !messageBox1 || !messageBox2 || !messageBox3 || !progressContainer || !progressBar) {
        setTimeout(attachScriptRunnerButtonListener, 200);
        return;
    }
    const issueKey = "QA-62751";
    const issueType = "TestExecution";
    //const issueType = "TestPlan";
    
    runButton.disabled = true;
    function setProgress(pct) {
        progressContainer.classList.remove("hidden");
        progressBar.style.width = pct + "%";
        progressBar.innerText = pct + "%";
    }
    switch (issueType) {
        case "TestPlan":
            statusButton.innerText = "Run Status";
            runButton.innerText = "Run TestPlan TestExecutions";            
            break;
        case "TestExecution":
            statusButton.innerText = "Run Status";
            runButton.innerText = "Run TestExecution XrayTests";
            break;
        default:
            messageBox1.classList.remove("hidden");
            messageBox1.innerText =
                "Test Automation is accessible only from TestPlans or TestExecutions";
            return;
    }
    messageBox1.classList.remove("hidden");
    messageBox1.innerText = "Test Automation Service is Online\nMode: TestPlan";
    runButton.disabled = true;
    
    statusButton.addEventListener("click", () => {
        runButton.disabled = true;
        setProgress(0);
        messageBox1.classList.remove("hidden");
        messageBox2.classList.remove("hidden");
        messageBox3.classList.remove("hidden");
        messageBox1.innerText =`Init: IssueKey = ${issueKey} IssueType = ${issueType} Test Automation Service is Online`;
        messageBox2.innerText = "";
        messageBox3.innerText = "";
        const fakeItems =
            issueType === "TestPlan"
                ? [
                    { execution: "QA-4", tests: 2 },
                    { execution: "QA-16", tests: 2 },
                    { execution: "QA-17", tests: 2 },
                    { execution: "QA-18", tests: 2 },
                    { execution: "QA-19", tests: 3 }
                  ]
                : [
                    { test: "QA-101", summary: "Login Test" },
                    { test: "QA-102", summary: "Search Test" },
                    { test: "QA-103", summary: "Booking Flow Test" },
                    { test: "QA-104", summary: "Payment Test" },
                    { test: "QA-105", summary: "Cancellation Test" }
                  ];

        let pct = 0;
        let index = 0;
        const interval = setInterval(() => {
            pct += 20;
            if (pct > 100) pct = 100;
            setProgress(pct);
            if (index < fakeItems.length) {
                const item = fakeItems[index];
                if (issueType === "TestPlan") {
                    messageBox2.innerText += `Execution ${index + 1}: ${item.execution} running ${item.tests} tests...\n`;
                } else {
                    messageBox2.innerText += `Test ${index + 1}: ${item.test} - ${item.summary} running...\n`;
                }
                messageBox2.scrollTop = messageBox2.scrollHeight;
                index++;
            }

            if (pct === 100) {
                clearInterval(interval);
                messageBox2.innerText += "All finished!\n";
                messageBox3.innerText =`Final Fake Response: ${JSON.stringify(fakeItems, null, 2)}`;
                // Enable second button ONLY after status completes
                runButton.disabled = false;
            }
        }, 700);
    });
    runButton.addEventListener("click", () => {
        messageBox1.classList.remove("hidden");
        messageBox2.classList.remove("hidden");
        messageBox3.classList.remove("hidden");
        messageBox1.innerText =`Run button clicked IssueKey = ${issueKey} IssueType = ${issueType}`;
        messageBox2.innerText = "Ready to execute real /run logic next";
        messageBox3.innerText = "Placeholder – real API call will be wired here";
    });
}
document.addEventListener("DOMContentLoaded", attachScriptRunnerButtonListener);
