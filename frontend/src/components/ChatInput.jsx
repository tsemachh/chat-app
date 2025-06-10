import { useRef, useState } from "react";
import { chatState } from "../state/chatState";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";

const ChatInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, imgPreview] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMsg } = chatState();

  // for future implementation
  const [isUploading, setIsUploading] = useState(false);

  const imgChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      imgPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImg = () => {
    imgPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleMsg = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      await sendMsg({
        text: text.trim(),
        image: imagePreview,
      });

      // Clear form
      setText("");
      imgPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImg}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleMsg} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={imgChange}
          />

          <button
          type="button"
          className={`hidden sm:flex btn btn-circle ${imagePreview ? 
            "text-emerald-500" : 
            "text-zinc-400"}`}
          onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};
export default ChatInput;
