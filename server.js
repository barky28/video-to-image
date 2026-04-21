const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");
const sharp = require("sharp");

const app = express();

app.use(cors());
app.use(express.json());

const BASE_URL = "https://video-to-image-production.up.railway.app";

// pastikan folder frames ada
if (!fs.existsSync("frames")) {
  fs.mkdirSync("frames");
}

app.use("/frames", express.static("frames"));

app.get("/", (req, res) => {
  res.send("Server hidup");
});


// 🔥 FUNCTION PILIH BEST FRAME
async function getBestFrame(files) {
  let bestScore = 0;
  let bestFile = null;

  for (const file of files) {
    const img = sharp(`frames/${file}`);
    const { data } = await img
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let score = 0;

    for (let i = 1; i < data.length; i++) {
      score += Math.abs(data[i] - data[i - 1]);
    }

    if (score > bestScore) {
      bestScore = score;
      bestFile = file;
    }
  }

  return bestFile;
}


// 🚀 GENERATE FRAME
app.post("/generate", async (req, res) => {
  const url = req.body.url;

  if (!url) {
    return res.json({ error: "URL kosong" });
  }

  const videoFile = `video_${Date.now()}.mp4`;

  console.log("Download video...");

  exec(`yt-dlp -f "bv*+ba/b" -o ${videoFile} "${url}"`, async (err, stdout, stderr) => {
    if (err) {
      console.log("YTDLP ERROR:", stderr);
      return res.json({ error: "Download gagal" });
    }

    console.log("Ambil frame...");

    console.log("Video file:", videoFile);
console.log("URL:", url);

    // hapus frame lama
    fs.readdirSync("frames").forEach(file => {
      fs.unlinkSync(`frames/${file}`);
    });

    exec(`ffmpeg -i ${videoFile} -vf "fps=1,scale=720:-1" frames/frame_%03d.jpg`, async (err, stdout, stderr) => {
      if (err) {
        console.log("FFMPEG ERROR:", stderr);
        return res.json({ error: "FFmpeg gagal" });
      }

      const files = fs.readdirSync("frames");

      // 🔥 BEST FRAME
      const bestFrame = await getBestFrame(files);

      const urls = files.map(file => `${BASE_URL}/frames/${file}`);

      res.json({
        success: true,
        frames: urls,
        best: `${BASE_URL}/frames/${bestFrame}`
      });

      // 🔥 CLEANUP VIDEO
      setTimeout(() => {
        try {
          fs.unlinkSync(videoFile);
        } catch {}
      }, 15000);
    });
  });
});


// 🎬 DOWNLOAD VIDEO
app.get("/download-video", (req, res) => {
  const files = fs.readdirSync(".");
  const video = files.find(f => f.endsWith(".mp4"));

  if (!video) {
    return res.json({ error: "Video tidak ditemukan" });
  }

  res.download(video);
});


app.listen(3000, () => {
  console.log("Server jalan di port 3000");
});