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
  var isOpen = false;

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

  // When the widget panel opens/closes, the widget sends a postMessage.
  window.addEventListener("message", function (e) {
    if (e.source !== iframe.contentWindow) return;
    if (e.data && e.data.type === "medflex-widget-open") {
      isOpen = e.data.open;
      iframe.style.pointerEvents = isOpen ? "auto" : "none";
    }
  });

  // Track mouse position: enable pointer-events when hovering the
  // bottom-right widget zone (300×200 px) so the bubble stays clickable.
  document.addEventListener("mousemove", function (e) {
    if (isOpen) return; // already auto when panel is open
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var nearWidget = e.clientX >= vw - 320 && e.clientY >= vh - 220;
    iframe.style.pointerEvents = nearWidget ? "auto" : "none";
  });
})();
