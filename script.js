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
			fetch('https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/ping', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			})
				.then(response => response.json())
				.then(data => {
					//messageBox.innerText = data.message || "Action completed!";
					//messageBox.style.color = "green";
					
					messageBox.innerText = JSON.stringify(data, null, 2); // Prettified JSON
          			//messageBox.style.whiteSpace = "pre-wrap"; // preserve line breaks
          			messageBox.style.color = "black";
				})
				.catch(error => {
					messageBox.innerText = "Error: " + error;
					messageBox.style.color = "red";
				});
		});
	} else {
		// Retry after a short delay
		setTimeout(attachScriptRunnerButtonListener, 200);
	}
}

document.addEventListener("DOMContentLoaded", attachScriptRunnerButtonListener);