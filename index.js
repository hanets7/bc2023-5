const express = require("express");
const app = express();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const bodyParser = require('body-parser');

const upload = multer();

app.use(bodyParser.json());

const notesFilePath = "notes.json";

const getNotes = (cb) => {
  if (fs.existsSync(notesFilePath)) {
    fs.readFile(notesFilePath, "utf-8", (err, data) => {
      if (err) {
        cb(err, null);
        return;
      }
      cb(null, JSON.parse(data));
    });
  } else {
    cb(null, []);
  }
};

const saveNotes = (notes, cb) => {
  fs.writeFile(notesFilePath, JSON.stringify(notes, null, 2), "utf-8", (err) => {
    if (err) {
      cb(err);
      return;
    }
    cb(null);
  });
};

app.get("/notes", async (req, res) => {
  getNotes((err, notes) => {
    if (err) {
      console.error("Помилка при зчитуванні нотаток:", err);
      res.status(500).send("Помилка сервера при зчитуванні нотаток.");
      return;
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(notes, null, 2));
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "static", "UploadForm.html"));
});

app.post("/upload", upload.none(), async (req, res) => {
  const { note_name, note } = req.body;

  if (!note_name || !note) {
    return res.status(400).send("Неправильний запит: Необхідно вказати назву та текст нотатки.");
  }

  getNotes((error, notes) => {
    if (error) {
      console.error("Помилка при зчитуванні нотаток:", error);
      res.status(500).send("Помилка сервера при зчитуванні нотаток.");
      return;
    }

    const existingNote = notes.find((n) => n.note_name === note_name);
    if (existingNote) {
      return res.status(400).send("Неправильний запит: Замітка з такою назвою вже існує.");
    }

    notes.push({ note_name, note });
    saveNotes(notes, (saveError) => {
      if (saveError) {
        console.error("Помилка при збереженні нотаток:", saveError);
        res.status(500).send("Помилка сервера при збереженні нотаток.");
        return;
      }
      res.status(201).send("Нотатку завантажено успішно!");
    });
  });
});

app.get("/notes/:note_name", async (req, res) => {
  getNotes((error, notes) => {
    if (error) {
      console.error("Помилка при зчитуванні нотаток:", error);
      res.status(500).send("Помилка сервера при зчитуванні нотаток.");
      return;
    }

    const { note_name } = req.params;
    const note = notes.find((n) => n.note_name === note_name);

    if (!note) {
      return res.status(404).send("Не знайдено: Нотатка з вказаною назвою не існує.");
    }

    res.send(note.note);
  });
});

app.put("/notes/:note_name", upload.none(), async (req, res) => {
  getNotes((error, notes) => {
    if (error) {
      console.error("Помилка при зчитуванні нотаток:", error);
      res.status(500).send("Помилка сервера при зчитуванні нотаток.");
      return;
    }

    const { note_name } = req.params;
    const { note } = req.body;

    const existingNoteIndex = notes.findIndex((n) => n.note_name === note_name);

    if (existingNoteIndex === -1) {
      return res.status(404).send("Не знайдено: Нотатка з вказаною назвою не існує.");
    }

    notes[existingNoteIndex].note = note;
    saveNotes(notes, (saveError) => {
      if (saveError) {
        console.error("Помилка при збереженні нотаток:", saveError);
        res.status(500).send("Помилка сервера при збереженні нотаток.");
        return;
      }
      res.send("Нотатку оновлено успішно!");
    });
  });
});

app.delete("/notes/:note_name", async (req, res) => {
  getNotes((error, notes) => {
    if (error) {
      console.error("Помилка при зчитуванні нотаток:", error);
      res.status(500).send("Помилка сервера при зчитуванні нотаток.");
      return;
    }

    const { note_name } = req.params;

    const updatedNotes = notes.filter((n) => n.note_name !== note_name);

    if (notes.length === updatedNotes.length) {
      return res.status(404).send("Не знайдено: Нотатка з вказаною назвою не існує.");
    }

    saveNotes(updatedNotes, (saveError) => {
      if (saveError) {
        console.error("Помилка при збереженні нотаток:", saveError);
        res.status(500).send("Помилка сервера при збереженні нотаток.");
        return;
      }
      res.send("Нотатку видалено успішно!");
    });
  });
});

app.listen(8000, () => {
  console.log("Сервер запущено на localhost:8000");
});