document.addEventListener("DOMContentLoaded", function () {
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
        })
        .catch(error => {
          messageBox.innerText = "Error: " + error;
          messageBox.style.color = "red";
        });
    });
  }
});