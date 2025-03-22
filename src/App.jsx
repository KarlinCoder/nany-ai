import { useState, useRef, useEffect } from "react";

function App() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Ref para el contenedor del área de chat
  const chatContainerRef = useRef(null);

  // Función para manejar el envío del mensaje al chatbot
  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!userInput.trim()) return;

    // Agregar el mensaje del usuario al historial
    const newUserMessage = { role: "user", content: userInput };
    setMessages((prev) => [...prev, newUserMessage]);
    setUserInput("");

    // Iniciar la conexión SSE con el servidor
    setIsLoading(true);
    const eventSource = new EventSource(
      `http://127.0.0.1:5000/chat?message=${encodeURIComponent(userInput)}`
    );

    let botResponse = "";

    // Escuchar eventos del servidor
    eventSource.onmessage = (event) => {
      const data = event.data;

      if (data === "[DONE]") {
        // Finalizar la conexión cuando se recibe "[DONE]"
        eventSource.close();
        setIsLoading(false);
        return;
      }

      // Acumular la respuesta del chatbot
      botResponse += data;

      // Asegurarse de que el texto no esté "todo junto"
      const formattedMessage = botResponse.replace(/([.,!?;:])/, " $1");

      // Actualizar el estado del chat
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.role === "assistant") {
          return [
            ...prev.slice(0, -1),
            { role: "assistant", content: formattedMessage },
          ];
        }
        return [...prev, { role: "assistant", content: formattedMessage }];
      });
    };

    // Manejar errores
    eventSource.onerror = () => {
      console.error("Error en la conexión SSE");
      eventSource.close();
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Lo siento, ocurrió un error." },
      ]);
    };
  };

  // Efecto para mantener el scroll en el último mensaje
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 py-4 to-gray-900 text-white flex flex-col">
      {/* Encabezado */}
      <header className="text-center py-6">
        <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
          Nany AI
        </h1>
        <p className="text-lg text-gray-300 mt-2">
          I´m The Smartest Woman In The World
        </p>
      </header>

      {/* Área de chat con scroll */}
      <div
        ref={chatContainerRef} // Referencia al contenedor del chat
        className="flex-grow overflow-y-auto p-4 max-h-[calc(100vh-200px)]" // Alto máximo para activar el scroll
      >
        <div className="space-y-4 max-w-[1000px] mx-auto">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-4 rounded-2xl max-w-[70%] transition-all duration-300 ${
                msg.role === "user"
                  ? "bg-blue-600 ml-auto animate-fade-in-right"
                  : "bg-gray-700 mr-auto animate-fade-in-left"
              }`}
            >
              <p className="text-lg">{msg.content}</p>
            </div>
          ))}
          {isLoading && (
            <div className="p-4 rounded-2xl bg-gray-700 mr-auto max-w-[70%] animate-pulse">
              <p className="text-lg">Escribiendo...</p>
            </div>
          )}
        </div>
      </div>

      {/* Formulario de entrada (fijo en la parte inferior) */}
      <form
        onSubmit={handleSendMessage}
        className="sticky bottom-0 bg-gray-900 p-4 flex gap-4 border-t border-gray-800"
      >
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
          className="flex-grow p-4 rounded-2xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-lg"
          disabled={isLoading} // Deshabilitar el input mientras se carga
        />
        <button
          type="submit"
          className={`p-4 rounded-2xl text-lg ${
            isLoading
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90"
          } text-white transition duration-200`}
          disabled={isLoading} // Deshabilitar el botón mientras se carga
        >
          {isLoading ? "Enviando..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}

export default App;
