import express from "express";
import {spawn} from "node:child_process";
import {readFile} from "node:fs/promises";
import {resolve, join} from "node:path";

const ls = spawn("ls", ["-lh", "/usr"]);
const port = 3000;

ls.stdout.on("data", data => {
  console.log(`stdout: ${data}`);
});

ls.stderr.on("data", data => {
  console.error(`stderr: ${data}`);
});

ls.on("close", code => {
  console.log(`child process exited with code ${code}`);
});

const app = express();

app.get("/", (req, res) => {
  const dir = join(resolve(__dirname), "../public");
  console.log(dir);
  try {
    const dockerCommand = `docker run -v ${dir}:/home/node/app --rm node:test npm test`;
    const process = spawn("sh", ["-c", dockerCommand], {
      timeout: 100000,
    });

    let stdout = "";
    process.stdout.on("data", data => {
      console.log(data);
      stdout += data;
    });

    process.on("close", async e => {
      // 結果をレスポンスとして返す
      console.log("close", stdout);
      console.log("event", e);
      res.send(stdout);

      // 一時ファイルを削除する
      // await fs.promises.rm(tempPath);
      // await fs.promises.rmdir(tempDir);
    });
    process.stderr.on("data", data => {
      stdout += Buffer.from(data).toString();
      console.log("stderr", Buffer.from(data).toString());
    });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
  // res.send("Hello World");
});

app.listen(port, () => {
  console.log("Server started on port 3000");
});
