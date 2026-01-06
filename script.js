const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
function getIssueKeyFromUrl() {
    const match = window.location.pathname.match(/([A-Z]+-\d+)/);
    return match ? match[1] : null;
}

async function attachScriptRunnerButtonListener() {
    const statusButton = document.getElementById("run-status-button");
    const runButton    = document.getElementById("run-dynamic-button");
    const messageBox1  = document.getElementById("status-box-1");
    const messageBox2  = document.getElementById("status-box-2");
    const messageBox3  = document.getElementById("status-box-3");
    const progressContainer = document.getElementById("progress-container");
    const progressBar = document.getElementById("progress-bar");
    const ContextissueKey = window.AdaptavistBridgeContext?.context?.issueKey;
    
    // ScriptRunner can re-render → wait for DOM
    if (!statusButton || !runButton || !messageBox1 || !messageBox2 || !messageBox3 || !progressContainer || !progressBar) {
        setTimeout(attachScriptRunnerButtonListener, 200);
        return;
    }
    let issueKey = getIssueKeyFromUrl();  
    if (!issueKey) {
        for (let i = 0; i < 5; i++) {
            await sleep(150);
            issueKey = getIssueKeyFromUrl();
            if (issueKey) break;
        }
    }    
    if (!issueKey) {
    console.warn("IssueKey not resolved yet, continuing with placeholder");
    issueKey = "QA-62751";
    }
   
    console.log("Resolved IssueKey:", issueKey);

    const issueType = "TestExecution";
    // const issueType = "TestPlan";

    runButton.disabled = true;

    function setProgress(pct) {
        progressContainer.classList.remove("hidden");
        progressBar.style.width = pct + "%";
        progressBar.innerText = pct + "%";
    }

    function fetchWithTimeout(url, timeout = 5000) {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), timeout);
        return fetch(url, { method: "GET", signal: controller.signal })
            .finally(() => clearTimeout(tid));
    }

    async function pingAutomationService() {
        messageBox1.classList.remove("hidden");
        messageBox1.innerText = "Connecting to Test Automation Service...";
        
        try {
            const resp = await fetchWithTimeout(
                "https://dcmcobwasqld01.ad.mvwcorp.com:8443/api/v1/ping",
                5000
            );

            if (!resp.ok) {
                throw new Error(`HTTP ${resp.status}`);
            }

            const text = await resp.text();
            messageBox1.innerText =
                "Test Automation Service is Online\n" +
                `Ping Response: ${text}`;

            return true;
        } catch (error) {
            console.error("Ping failed:", error);
            messageBox1.innerText =
                error.name === "AbortError" || error.message === "Failed to fetch"
                    ? "Test Automation is accessible only from the corporate network (VPN required)"
                    : "Test Automation Service is Offline. Please contact SVT Admin group";
            return false;
        }
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

    // Initial ping (ONLY ONCE)
    //const pingOk = await pingAutomationService();
    //if (!pingOk) return;

    runButton.disabled = true;

    statusButton.addEventListener("click", () => {
        runButton.disabled = true;
        setProgress(0);

        messageBox1.classList.remove("hidden");
        messageBox2.classList.remove("hidden");
        messageBox3.classList.remove("hidden");

        messageBox1.innerText =`Init: IssueKey = ${issueKey} IssueType = ${issueType} Test Automation Service is Online`;
        messageBox1.innerText =`ContextIssueKey = ${ContextissueKey}`;
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
                    messageBox2.innerText +=
                        `Execution ${index + 1}: ${item.execution} running ${item.tests} tests...\n`;
                } else {
                    messageBox2.innerText +=
                        `Test ${index + 1}: ${item.test} - ${item.summary} running...\n`;
                }
                messageBox2.scrollTop = messageBox2.scrollHeight;
                index++;
            }
            if (pct === 100) {
                clearInterval(interval);
                messageBox2.innerText += "All finished!\n";
                messageBox3.innerText = `Final Response: ${JSON.stringify(fakeItems, null, 2)}`;
                runButton.disabled = false;
            }}, 700);
    });

    runButton.addEventListener("click", () => {
        messageBox1.classList.remove("hidden");
        messageBox2.classList.remove("hidden");
        messageBox3.classList.remove("hidden");

        messageBox1.innerText =
            `Run button clicked IssueKey = ${issueKey} IssueType = ${issueType}`;
        messageBox2.innerText = "Ready to execute real /run logic next";
        messageBox3.innerText = "Placeholder – real API call will be wired here";
    });
}

document.addEventListener("DOMContentLoaded", attachScriptRunnerButtonListener);
