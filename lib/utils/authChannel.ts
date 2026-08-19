// Kênh đồng bộ đăng xuất thật sự giữa các tab (BroadcastChannel, không phải window event
// vốn chỉ nội bộ 1 tab).
const CHANNEL_NAME = "capstone-auth";

export function broadcastLogout() {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.postMessage("logout");
  channel.close();
}

export function subscribeToLogout(onLogout: () => void): () => void {
  if (typeof BroadcastChannel === "undefined") return () => {};
  const channel = new BroadcastChannel(CHANNEL_NAME);
  const handleMessage = (event: MessageEvent) => {
    if (event.data === "logout") onLogout();
  };
  channel.addEventListener("message", handleMessage);
  return () => {
    channel.removeEventListener("message", handleMessage);
    channel.close();
  };
}
