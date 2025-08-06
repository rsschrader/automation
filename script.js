function attachScriptRunnerButtonListener() {
  const button = document.getElementById("run-custom-script");
  const messageBox = document.getElementById("script-response-message");

  if (button) {
    button.addEventListener("click", function () {
      fetch('/rest/scriptrunner/latest/custom/run-my-custom-script?issueKey=${issue.key}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(data => {
          messageBox.innerText = data.message || "Action completed!";
          messageBox.style.color = "green";
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