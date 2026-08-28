(function () {
  var script = document.currentScript;
  if (!script) return;

  var src = script.src || "";
  var query = src.includes("?") ? src.split("?")[1] : "";
  var params = new URLSearchParams(query);
  var id = params.get("id");
  if (!id) {
    console.warn("[MedFlex Widget] Kein ?id= Parameter gefunden.");
    return;
  }

  var origin = src.split("/widget.js")[0];

  var iframe = document.createElement("iframe");
  iframe.src = origin + "/widget/" + id;
  iframe.title = "MedFlex Online Rezeption";
  iframe.allow = "microphone";
  iframe.setAttribute("allowtransparency", "true");
  iframe.setAttribute("frameborder", "0");
  iframe.style.cssText = [
    "position: fixed",
    "inset: 0",
    "width: 100%",
    "height: 100%",
    "border: none",
    "pointer-events: none",
    "z-index: 2147483647",
    "background: transparent",
  ].join("; ");

  document.body.appendChild(iframe);
})();
