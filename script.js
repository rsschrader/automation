document.addEventListener("DOMContentLoaded", function () {
  const btn = document.getElementById("run-script-btn");
  const statusDiv = document.getElementById("run-script-status");

  btn.addEventListener("click", function () {
    statusDiv.textContent = "Running...";

    AP.request({
      url: "/rest/scriptrunner/latest/custom/my-custom-endpoint",
      type: "GET",
      success: function () {
        statusDiv.textContent = "Script completed ✅";
      },
      error: function () {
        statusDiv.textContent = "Script failed ❌";
      }
    });
  });
});