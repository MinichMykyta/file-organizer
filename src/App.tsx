// Extend the Window interface to include showDirectoryPicker
declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }
}

import { useState } from "react";
import folderOutline from "./folder-outline.svg";
import "./App.css";

function App() {
  const fileCategories: { [key: string]: string } = {
    jpg: "Images",
    jpeg: "Images",
    png: "Images",
    gif: "Images",
    svg: "Images",
    bmp: "Images",
    webp: "Images",

    mp3: "Music",
    wav: "Music",
    aac: "Music",
    flac: "Music",
    ogg: "Music",

    mp4: "Videos",
    avi: "Videos",
    mkv: "Videos",
    mov: "Videos",
    wmv: "Videos",

    pdf: "Documents",
    doc: "Documents",
    docx: "Documents",
    xls: "Documents",
    xlsx: "Documents",
    ppt: "Documents",
    pptx: "Documents",
    txt: "Documents",
  };

  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(
    null
  );

  const handleSelectDirectory = async () => {
    if (!window.showDirectoryPicker) {
      alert(
        "Your browser does not support the File System Access API. Please use a modern browser like Chrome or Edge."
      );
      return;
    }

    try {
      const handle = await window.showDirectoryPicker();
      setDirHandle(handle);
      alert(`Directory "${handle.name}" selected successfully!`);
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error selecting directory:", error);
        alert("Failed to select directory. Please try again.");
      }
    }
  };

  const handleSortDirectory = async () => {
    if (!dirHandle) {
      alert("Please select a directory first!");
      return;
    }

    try {
      const categories = ["Documents", "Images", "Music", "Videos"];
      const categoryHandles: { [key: string]: FileSystemDirectoryHandle } = {};

      for (const category of categories) {
        categoryHandles[category] = await dirHandle.getDirectoryHandle(
          category,
          { create: true }
        );
      }

      const fileEntries: { name: string; entry: FileSystemFileHandle }[] = [];

      for await (const [name, entry] of dirHandle.entries()) {
        if (entry.kind === "file") {
          fileEntries.push({ name, entry });
        }
      }

      await Promise.all(
        fileEntries.map(async ({ name, entry }) => {
          const fileExtension = name.split(".").pop()?.toLowerCase();
          const targetDirName = fileExtension && fileCategories[fileExtension];

          if (targetDirName) {
            const targetDirHandle = categoryHandles[targetDirName];

            const file = await entry.getFile();
            const targetFileHandle = await targetDirHandle.getFileHandle(name, {
              create: true,
            });
            const writable = await targetFileHandle.createWritable();
            await writable.write(file);
            await writable.close();

            await dirHandle.removeEntry(name);
          }
        })
      );

      alert("All files have been sorted successfully!");
    } catch (error) {
      console.error("Error sorting directory:", error);
    }
  };

  return (
    <>
      <div className="card">
        <img
          src={folderOutline}
          alt="Directory-Image"
          className="icon"
          onClick={handleSelectDirectory}
          style={{ cursor: "pointer" }}
        />
      </div>
      <h1>
        Click the Sort button to organize files in your selected directory.
      </h1>
      <div className="card">
        <button onClick={handleSortDirectory}>Sort</button>
      </div>
      <p className="description">
        This file organizer will sort your files into Documents, Images, Music,
        and Videos.
      </p>
    </>
  );
}

export default App;
