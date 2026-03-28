const WS_PROTOCOL = window.location.protocol === "https:" ? "wss:" : "ws:";
const WS_PORT = window.location.port ? `:${window.location.port}` : "";
const ws = new WebSocket(`${WS_PROTOCOL}//${window.location.hostname}${WS_PORT}`);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  document.getElementById("status").innerHTML = `
    🚑 Ambulance Distance: <b>${data.distance}</b><br>
    ⏱ ETA: <b>${data.eta}</b>
  `;
}