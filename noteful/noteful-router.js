const express = require("express");
const NotefulService = require("./noteful-service");
const xss = require("xss");
const notefulRouter = express.Router();
const jsonParser = express.json();
const path = require("path");

notefulRouter
  .route("/")
  .get((req, res, next) => {
    NotefulService.getAllNotes(req.app.get("db"))
      .then((notes) => {
        res.json(notes);
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { name, content, folderId } = req.body;
    const newNote = { name, content, folderId };
    NotefulService.insertNote(req.app.get("db"), newNote)
      .then((notes) => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${notes.id}`))
          .json(notes);
      })
      .catch(next);
  });

notefulRouter
  .route("/:note_id")
  .all((req, res, next) => {
    NotefulService.getById(req.app.get("db"), req.params.notes_id)
      .then((notes) => {
        if (!notes) {
          return res.status(404).json({
            error: { message: `Note doesn't exist` },
          });
        }
        res.notes = notes; // save the note for the next middleware
        next(); // don't forget to call next so the next middleware happens!
      })
      .catch(next);
  })
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    NotefulService.getById(knexInstance, req.params.notes_id)
      .then((notes) => {
        if (!notes) {
          return res.status(404).json({
            error: { message: `Note doesn't exist` },
          });
        }
        res.json({
          id: notes.id,
          title: xss(notes.title), // sanitize title
          content: xss(notes.content), // sanitize url
          folderId: xss(notes.folderId), // sanitize description
          date_published: notes.date_published,
        });
      })
      .catch(next);
  })
  .delete((req, res, next) => {
    NotefulService.Note(req.app.get("db"), req.params.note_id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { title, content, folderId } = req.body;
    const noteToUpdate = { title, content, folderId };
    const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'title', 'content', 'folderID'`,
        },
      });
    }
    NotefulService.updateNote(
      req.app.get("db"),
      req.params.note_id,
      noteToUpdate
    )
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });

notefulRouter
  .route("/:folder_id")
  .all((req, res, next) => {
    NotefulService.getByFolderId(req.app.get("db"), req.params.folder_id)
      .then((folder) => {
        if (!folder) {
          return res.status(404).json({
            error: { message: `folder doesn't exist` },
          });
        }
        res.folder = folder; // save the note for the next middleware
        next(); // don't forget to call next so the next middleware happens!
      })
      .catch(next);
  })
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    NotefulService.getByFolderId(knexInstance, req.params.folder_id)
      .then((folder) => {
        if (!folder) {
          return res.status(404).json({
            error: { message: `Folder doesn't exist` },
          });
        }
        res.json({
          id: folder.id,
          title: xss(folder.name), // sanitize title
        });
      })
      .catch(next);
  })

  .delete((req, res, next) => {
    NotefulService.Folder(req.app.get("db"), req.params.folder_id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { folder_name } = req.body;
    const folderToUpdate = { folder_name };
    const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'folder name'`,
        },
      });
    }
    NotefulService.updateFolder(
      req.app.get("db"),
      req.params.note_id,
      folderToUpdate
    )
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = notefulRouter;
