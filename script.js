
function findElementByTextDebug(tag, text) {
	const wpar = window.parent;
	const wown = document.ownerDocument;
	
	window.document
	
	document.getElementsByTagName
	
    const elements = Array.from(document.ownerDocument.getElementsByTagName(tag));
    console.log(`Found ${elements.length} <${tag}> elements`);

    elements.forEach((el, index) => {
        console.log(`[#${index}]`, el, "TEXT:", el.textContent.trim());
    });

	const match = elements.find(el => el.textContent.includes(text));
    if (match) {
        console.log("✅ Found match:", match);
    } else {
        console.warn(`❌ No element with exact text "${text}" found`);
    }
    return match;
}

// Example usage:
const el = findElementByTextDebug("span", "Fragment");
if (el) el.click();





function attachScriptRunnerButtonListener() {
	const button = document.getElementById("run-custom-script");
	const button2 = document.getElementById("run-custom-script2");
	const messageBox = document.getElementById("script-response-message");
	
	

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