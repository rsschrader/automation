
function attachScriptRunnerButtonListener() {
	const button = document.getElementById("run-custom-script");
	const button2 = document.getElementById("run-custom-script2");
	const messageBox = document.getElementById("script-response-message");
	const issueKey = window.AdaptavistBridgeContext?.context?.issueKey;
	
	if (issueKey === "QA-45036") {
		button.style.display = "block";
	}

	if (button) {
		button.addEventListener("click", function() {
			button2.style.display = "block";
			button.style.display = "none";
			messageBox.innerText = "Button 1"; 
			
			let i = 1;
			let max = 5;
			
			let intervalId = setInterval(function () {
				console.log("Iteration", i);
				messageBox.innerText = "Iteration: " + i;
				i++;
				
				if (i > max) {
				  	clearInterval(intervalId);
					messageBox.innerText = "Loop finished";
				}
			}, 1000); // 1-second delay between iterations

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