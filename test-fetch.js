fetch("http://127.0.0.1:8787/api/chat", {
  method: "OPTIONS"
}).then(r => {
  console.log("Status:", r.status);
}).catch(e => console.error(e));
