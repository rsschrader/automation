
function attachScriptRunnerButtonListener() {
    const messageBox = document.getElementById("script-response-message");
    const issueKey = window.AdaptavistBridgeContext?.context?.issueKey;

    const fetchWithTimeout = (url, options = {}, timeout = 300000) => {
        return Promise.race([
            fetch(url, options),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Request timed out")), timeout)
            )
        ]);
    };

    const buttonMain = document.getElementById("run-test-main-script");
    if (issueKey === "QA-6358" || issueKey === "QA-57546" || issueKey === "QA-45036") {
		buttonMain.style.display = "block";
	} else {
		return;
	}
    if (buttonMain) {
        buttonMain.addEventListener("click", async function () {
            try {
            const response = await fetchWithTimeout(
                `https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/jira/type?JiraIssueKey=${issueKey}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            } catch (error) {
                console.error("Caught error in fetch:", error);
                messageBox.innerText = "Fetch error: " + error.message;
                messageBox.style.color = "red";
            }
        });
    }
}
document.addEventListener("DOMContentLoaded", attachScriptRunnerButtonListener);
