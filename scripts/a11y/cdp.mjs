// Lớp điều khiển Edge headless qua Chrome DevTools Protocol, không dependency: Node 22+ có WebSocket toàn cục
// (kiểm bằng `node --version`; bộ đo dựng trên v24). Không dùng gói `ws`, không dùng puppeteer.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const EDGE_CANDIDATES = [
  process.env.EDGE_PATH,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
].filter(Boolean);

/**
 * Mở một Edge headless với hồ sơ tạm riêng và một tab 1280×900. `close()` tắt đúng tiến trình này THEO PID (kèm cây
 * con) và xoá hồ sơ tạm — không bao giờ giết theo tên tiến trình.
 */
export async function launch(tag, { width = 1280, height = 900 } = {}) {
  const edgePath = EDGE_CANDIDATES.find((p) => existsSync(p));
  if (!edgePath) throw new Error("Không thấy msedge.exe; đặt biến EDGE_PATH");
  const port = 9300 + Math.floor(Math.random() * 600);
  const profile = mkdtempSync(join(tmpdir(), `a11y-edge-${tag}-`));
  const edge = spawn(edgePath, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run", "--disable-extensions", "about:blank"], { stdio: "ignore" });

  let targets;
  for (let i = 0; i < 60; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.some((t) => t.type === "page")) break; } catch { /* chưa lên */ }
    await sleep(250);
  }
  if (!targets) { edge.kill(); throw new Error("Edge không mở cổng CDP"); }

  const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } else listeners.forEach((l) => l(d));
  };
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const i = ++id;
      pending.set(i, (d) => (d.error ? rej(new Error(`${method}: ${d.error.message}`)) : res(d.result)));
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  const evalJs = async (expression) => {
    const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text ?? "eval lỗi");
    return r.result.value;
  };
  for (const d of ["Page", "Runtime", "Network", "DOM", "Accessibility"]) await send(`${d}.enable`);
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });

  async function goto(url, settleMs = 1500) {
    const loaded = new Promise((r) => {
      const l = (d) => { if (d.method === "Page.loadEventFired") { listeners.splice(listeners.indexOf(l), 1); r(); } };
      listeners.push(l);
    });
    await send("Page.navigate", { url });
    await Promise.race([loaded, sleep(20000)]);
    await sleep(settleMs);
  }
  async function waitFor(expr, ms = 8000) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { if (await evalJs(expr)) return true; } catch { /* trang đang chuyển */ } await sleep(150); }
    return false;
  }
  const setInput = (selector, v) =>
    evalJs(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.focus();const p=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(el,${JSON.stringify(v)});el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  const click = (selector) => evalJs(`document.querySelector(${JSON.stringify(selector)}).click()`);
  async function key(k, code, vk, modifiers = 0) {
    await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers });
  }
  /** Tên và vai trò khả truy cập của một biểu thức JS trả về phần tử, đọc từ cây accessibility của trình duyệt. */
  async function axOf(expression) {
    const ev = await send("Runtime.evaluate", { expression });
    const objectId = ev.result?.objectId;
    if (!objectId) return null;
    try {
      const { node } = await send("DOM.describeNode", { objectId });
      const { nodes } = await send("Accessibility.getPartialAXTree", { backendNodeId: node.backendNodeId, fetchRelatives: false });
      const n = nodes[0];
      return n ? { role: n.role?.value ?? null, name: n.name?.value ?? "", ignored: !!n.ignored } : null;
    } finally {
      await send("Runtime.releaseObject", { objectId }).catch(() => {});
    }
  }
  async function close() {
    try { ws.close(); } catch { /* đã đóng */ }
    try {
      if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(edge.pid), "/T", "/F"], { stdio: "ignore" });
      else edge.kill("SIGKILL");
    } catch { /* đã tắt */ }
    await sleep(1000);
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* hồ sơ còn bị khoá: bỏ qua */ }
  }
  return { pid: edge.pid, send, evalJs, goto, waitFor, setInput, click, key, axOf, close };
}
