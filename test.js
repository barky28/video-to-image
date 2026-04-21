fetch("http://localhost:3000/generate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    url: "https://www.tiktok.com/@slametfatur.12/video/7626744529508486421"
  })
})
.then(res => res.json())
.then(data => console.log(data));