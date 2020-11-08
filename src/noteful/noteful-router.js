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
    const { name, content, folder_id } = req.body;
    const newNote = { name, content, folder_id };
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
  .route("/folders")
  .get((req, res, next) => {
    NotefulService.getAllFolders(req.app.get("db"))
      .then((folders) => {
        res.json(folders);
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { folder_name } = req.body;
    const newFolder = { folder_name };
    NotefulService.insertFolder(req.app.get("db"), newFolder)
      .then((folder) => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/folder/${folder.id}`))
          .json(folder);
      })
      .catch(next);
  });

notefulRouter
  .route("/:note_id")
  .all((req, res, next) => {
    NotefulService.getById(req.app.get("db"), req.params.note_id)
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
    NotefulService.getById(knexInstance, req.params.note_id)
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
          folder_id: notes.folder_id,
          date_published: notes.date_published,
        });
      })
      .catch(next);
  })
  .delete((req, res, next) => {
    NotefulService.deleteNote(req.app.get("db"), req.params.note_id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { title, content, folder_id } = req.body;
    const noteToUpdate = { title, content, folder_id };
    const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'title', 'content', 'folder_id'`,
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
  .route("/folder/:folder_id")
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
    NotefulService.deleteFolder(req.app.get("db"), req.params.folder_id)
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
      req.params.folder_id,
      folderToUpdate
    )
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = notefulRouter;
