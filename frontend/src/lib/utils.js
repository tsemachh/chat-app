//  "HH:MM" string to be displayed in chat messages

export function formatMessageTime(date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // use 24-hour format
  });
}