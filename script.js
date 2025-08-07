function attachScriptRunnerButtonListener() {
	const button = document.getElementById("run-custom-script");
	const messageBox = document.getElementById("script-response-message");

	if (button) {
		button.addEventListener("click", function() {
			const issueKey = window.AdaptavistBridgeContext?.context?.issueKey;
			if (issueKey) {
			  console.log("Issue key is:", issueKey);
			} else {
			  console.error("Issue key not found. Are you inside a ScriptRunner Cloud webPanel?");
			}

			messageBox.innerText = "Calling API...";
			messageBox.style.color = "gray";

			fetch('https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/ping', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			})
			.then(response => {
				if (!response.ok) {
					throw new Error(`HTTP error ${response.status}`);
				}
				return response.json();
			})
			.then(data => {
				messageBox.innerText = JSON.stringify(data, null, 2);
				messageBox.style.color = "black";
			})
			.catch(error => {
				console.error("Caught error in fetch:", error);
				messageBox.innerText = "Fetch error: " + error.message;
				messageBox.style.color = "red";
			});
		});
	} else {
		setTimeout(attachScriptRunnerButtonListener, 200);
	}
}

document.addEventListener("DOMContentLoaded", attachScriptRunnerButtonListener);