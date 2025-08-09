function attachScriptRunnerButtonListener() {
	const button = document.getElementById("run-custom-script");
	const button2 = document.getElementById("run-custom-script2");
	const messageBox = document.getElementById("script-response-message");

	if (button) {
		button.style.display = "none";
		button.addEventListener("click", function() {
			const issueKey = window.AdaptavistBridgeContext?.context?.issueKey;
			button2.style.display = "block";
		});
	} else {
		// Retry after a short delay
		setTimeout(attachScriptRunnerButtonListener, 200);
	}
}

document.addEventListener("DOMContentLoaded", attachScriptRunnerButtonListener);