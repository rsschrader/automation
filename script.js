function attachScriptRunnerButtonListener() {
	const button = document.getElementById("run-custom-script");
	const button2 = document.getElementById("run-custom-script2");
	const messageBox = document.getElementById("script-response-message");

	if (button) {
		button.addEventListener("click", function() {
			button2.style.display = "block";
			button.style.display = "none";
			messageBox.innerText = "Button 1"; 
		});
	} else {
		// Retry after a short delay
		setTimeout(attachScriptRunnerButtonListener, 200);
	}
	if (button2) {
		button2.addEventListener("click", function() {
			button.style.display = "block";
			button2.style.display = "none";
			messageBox.innerText = "Button 2" ;
		});
	} else {
		// Retry after a short delay
		setTimeout(attachScriptRunnerButtonListener, 200);
	}
}

document.addEventListener("DOMContentLoaded", attachScriptRunnerButtonListener);