import fs from "fs";
import path from "path";

export default function handler(req, res) {
    const filePath = path.join(process.cwd(), "public/uploads", req.query.file);
    const stat = fs.statSync(filePath);
    res.writeHead(200, {
        "Content-Type": path.extname(filePath) === ".mp4" ? "video/mp4" : "audio/mpeg",
        "Content-Length": stat.size,
    });
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
}