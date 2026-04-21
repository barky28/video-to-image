const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");

const app = express();
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(cors({
  origin: "*"
}));

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

  exec(`yt-dlp -f "bv*+ba/b" -o video.mp4 ${url}`, (err, stdout, stderr) => {
  if (err) {
    console.log("YTDLP ERROR:", stderr);
    return res.json({ error: "Download gagal" });
  }

  console.log("Download sukses");

  // hapus frame lama
  fs.readdirSync("frames").forEach(file => {
    fs.unlinkSync(`frames/${file}`);
  });

  exec(`ffmpeg -i video.mp4 -vf fps=1 frames/frame_%03d.jpg`, (err, stdout, stderr) => {
    if (err) {
      console.log("FFMPEG ERROR:", stderr);
      return res.json({ error: "FFmpeg gagal" });
    }

    console.log("FFmpeg sukses");

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