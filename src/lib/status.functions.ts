import { createServerFn } from "@tanstack/react-start";
import fs from "fs";
import path from "path";

export const updateStatus = createServerFn({ method: "POST" })
  .inputValidator((data: { nome: string; checked_in: boolean }) => data)
  .handler(async ({ data }) => {
    const filePath = path.join(process.cwd(), "src", "public", "status.txt");
    let statuses: Record<string, boolean> = {};
    try {
      if (fs.existsSync(filePath)) {
        const txt = await fs.promises.readFile(filePath, "utf-8");
        if (txt.trim()) statuses = JSON.parse(txt);
      }
    } catch (e) {
      console.error("Failed reading status file:", e);
    }

    statuses[data.nome] = data.checked_in;

    try {
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      await fs.promises.writeFile(filePath, JSON.stringify(statuses, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed writing status file:", e);
      throw e;
    }

    return { ok: true };
  });
