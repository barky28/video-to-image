const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

if (!fs.existsSync("frames")) {
  fs.mkdirSync("frames");
}

app.use("/frames", express.static("frames"));

app.get("/", (req, res) => {
  res.send("Server hidup");
});

app.post("/generate", (req, res) => {
  const url = req.body.url;

  if (!url) {
    return res.json({ error: "URL kosong" });
  }

  console.log("Download video...");

  exec(`yt-dlp -f "bv*+ba/b" -o video.mp4 ${url}`, (err, stdout, stderr) => {
    if (err) {
      console.log("YTDLP ERROR:", stderr);
      return res.json({ error: "Download gagal" });
    }

    console.log("Ambil frame...");

    // hapus frame lama
    fs.readdirSync("frames").forEach(file => {
      fs.unlinkSync(`frames/${file}`);
    });

    exec(`ffmpeg -i video.mp4 -vf fps=1 frames/frame_%03d.jpg`, (err, stdout, stderr) => {
      if (err) {
        console.log("FFMPEG ERROR:", stderr);
        return res.json({ error: "FFmpeg gagal" });
      }

      const files = fs.readdirSync("frames");

      const urls = files.map(file => {
        return `https://video-to-image-production.up.railway.app/frames/${file}`;
      });

      res.json({
        success: true,
        frames: urls
      });
    });
  });
});

app.listen(3000, () => {
  console.log("Server jalan di port 3000");
});