const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use("/frames", express.static("frames"));
if (!fs.existsSync("frames")) {
  fs.mkdirSync("frames");
}

app.get("/", (req, res) => {
  res.send("Server hidup");
});

app.post("/generate", (req, res) => {
  const url = req.body.url;

  if (!url) {
    return res.json({ error: "URL kosong" });
  }

  exec(`yt-dlp -f "bv*+ba/b" -o video.mp4 ${url}`, (err) => {
    if (err) return res.json({ error: "Download gagal" });

    exec(`ffmpeg -i video.mp4 -vf fps=1 frames/frame_%03d.jpg`, (err) => {
      if (err) return res.json({ error: "FFmpeg gagal" });

      const files = fs.readdirSync("frames");

const urls = files.map(file => {
  return `http://localhost:3000/frames/${file}`;
});

res.json({
  success: true,
  frames: urls
});
    });
  });
});

app.listen(3000, () => {
  console.log("Server jalan di http://localhost:3000");
});