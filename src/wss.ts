
// // // ! wss - class - pgNode

import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { runQuery } from "./db";
import { EditorPart } from "./constants/enums";

class WSS {
  private io: SocketIOServer;

  constructor(server: HttpServer) {
    // Initialize the Socket.IO server
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "http://localhost:5174",
        methods: ["GET", "POST"]
      },
    });

    this.initializeConnection();
  }

  // Initialize socket connection events
  private initializeConnection() {
    this.io.on("connection", (socket: Socket) => {
      console.log("New connection with socket id:", socket.id);

      // Handle getting document
      socket.on("get-document", async (documentid: string) => {
        await this.handleGetDocument(socket, documentid);
      });

      // Handle saving document
      socket.on(
        "save-document",
        async (documentid: string, content: any, editorPart: string) => {
          await this.handleSaveDocument(socket, documentid, content, editorPart);
        }
      );

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log("Socket disconnected with id:", socket.id);
      });
    });
  }

  // Fetch or create a new document
  private async handleGetDocument(socket: Socket, documentid: string) {
    try {
      const content = await this.getQuillContent(documentid);
      socket.join(documentid);
      socket.emit("document-editing", content);
    } catch (error) {
      console.error("Error fetching document:", error);
    }
  }

  // Save the document content to the database
  private async handleSaveDocument(
    socket: Socket,
    documentid: string,
    content: any,
    editorPart: string
  ) {
    try {
      if (editorPart !== EditorPart.BODY && editorPart !== EditorPart.TITLE) {
        return;
      }

      const text = `UPDATE quill SET ${editorPart}=$2 where documentid=$1;`;
      const value = [documentid, content];
      await runQuery(text, value);
      this.io.to(documentid).emit("saved", `${editorPart} saved by new backend`);
    } catch (error) {
      console.error("Error saving document:", error);
    }
  }

  // Function to fetch or initialize the Quill content from the database
  private async getQuillContent(documentid: string) {
    const text = "SELECT * FROM quill WHERE documentid=$1;";
    const value = [documentid];
    const getContent = await runQuery(text, value);

    if (getContent.rowCount === 0) {
      // No existing document, insert new empty title and body
      const insertText =
        'INSERT INTO quill(documentid, body, title) VALUES($1, $2, $3);';
      const insertValue = [documentid, `""`, `""`];
      await runQuery(insertText, insertValue);

      return { body: `""`, title: `""` };
    }

    const content = getContent.rows[0];
    const thing =
      content.body === ""
        ? `socketId : ${documentid}`
        : { title: content.title, body: content.body };

    return thing;
  }
}

export default WSS;