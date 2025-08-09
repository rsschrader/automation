function attachScriptRunnerButtonListener() {
	const button = document.getElementById("run-custom-script");
	const messageBox = document.getElementById("script-response-message");

	if (button) {
		button.addEventListener("click", function() {
			const issueKey = window.AdaptavistBridgeContext?.context?.issueKey;
			button.style.display = "none";
		});
	} else {
		// Retry after a short delay
		setTimeout(attachScriptRunnerButtonListener, 200);
	}
}

document.addEventListener("DOMContentLoaded", attachScriptRunnerButtonListener);