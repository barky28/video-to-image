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
app.post("/generate", (req, res) => {
  const url = req.body.url;

  if (!url) {
    return res.json({ error: "URL kosong" });
  }

  const videoFile = `video_${Date.now()}.mp4`;

  console.log("Download video...");
  console.log("URL:", url);

  exec(`yt-dlp -f "bv*+ba/b" -o ${videoFile} "${url}"`, (err, stdout, stderr) => {
    if (err) {
      console.log("YTDLP ERROR:", stderr);
      return res.json({ error: "Download gagal" });
    }

    if (!fs.existsSync(videoFile)) {
      return res.json({ error: "Video gagal didownload" });
    }

    console.log("Ambil frame...");

    // hapus frame lama
    fs.readdirSync("frames").forEach(file => {
      fs.unlinkSync(`frames/${file}`);
    });

    exec(`ffmpeg -i "${videoFile}" -vf "fps=1,scale=720:-1" frames/frame_%03d.jpg`, async (err, stdout, stderr) => {
      if (err) {
        console.log("FFMPEG ERROR:", stderr);
        return res.json({ error: "FFmpeg gagal" });
      }

      const files = fs.readdirSync("frames");

      if (files.length === 0) {
        return res.json({ error: "Frame kosong" });
      }

      try {
        const bestFrame = await getBestFrame(files);

        const urls = files.map(file => `${BASE_URL}/frames/${file}`);

        res.json({
          success: true,
          frames: urls,
          best: `${BASE_URL}/frames/${bestFrame}`,
          video: `${BASE_URL}/download-video?file=${videoFile}`
        });

      } catch (e) {
        console.log("BEST FRAME ERROR:", e);
        return res.json({ error: "Gagal proses gambar" });
      }

      // cleanup video
      setTimeout(() => {
        try {
          fs.unlinkSync(videoFile);
        } catch {}
      }, 60000);
    });
  });
});


// 🎬 DOWNLOAD VIDEO (by filename)
app.get("/download-video", (req, res) => {
  const file = req.query.file;

  if (!file) {
    return res.json({ error: "File tidak ada" });
  }

  if (!fs.existsSync(file)) {
    return res.json({ error: "Video tidak ditemukan" });
  }

  res.download(file);
});


app.listen(3000, () => {
  console.log("Server jalan di port 3000");
});