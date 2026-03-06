import { useState, useRef, useEffect } from "react";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // 🔊 AI voice reply
  const speak = (text) => {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.rate = 1;
    speech.pitch = 1;

    window.speechSynthesis.speak(speech);
  };

  const sendMessage = async (text = input) => {
    const message = text;

    if (!message.trim()) return;

    const userMessage = { text: message, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: message }),
      });

      const data = await response.json();

      const aiMessage = {
        text: data.reply,
        sender: "ai",
      };

      // 🔊 AI speaks response
      speak(data.reply);

      setMessages((prev) => [...prev, aiMessage]);

    } catch (error) {
      console.error(error);
    }

    setLoading(false);
    setInput("");
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;

      console.log("Voice detected:", transcript);

      setInput(transcript);
      sendMessage(transcript);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">

      {/* Header */}
      <div className="p-4 text-xl font-bold border-b border-gray-700">
        AI Emotional Companion 🤖
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`max-w-md p-3 rounded-lg ${
              msg.sender === "user"
                ? "bg-blue-500 ml-auto"
                : "bg-gray-700"
            }`}
          >
            {msg.text}
          </div>
        ))}

        {loading && (
          <div className="bg-gray-700 p-3 rounded-lg w-fit animate-pulse">
            AI is typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 flex gap-2 border-t border-gray-700">

        <input
          className="flex-1 p-2 rounded bg-gray-800 outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Talk or type how you feel..."
        />

        <button
          onClick={() => sendMessage()}
          className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600"
        >
          Send
        </button>

        <button
          onClick={startListening}
          className={`px-4 py-2 rounded ${
            listening ? "bg-red-500" : "bg-green-500"
          }`}
        >
          🎤
        </button>

      </div>

    </div>
  );
}

export default App;