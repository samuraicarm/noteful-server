const NotefulService = {

    getAllNotes(knex) {
        return knex.select('*').from('notes')
    },
    insertNote(knex, newNote) {
        return knex
            .insert(newNote)
            .into('notes')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex.from('notes').select('*').where('id', id).first()
    },
    deleteNote(knex, id) {
        return knex('notes')
            .where({ id })
            .delete()
    },
    updateNote(knex, id, newNoteFields) {
        return knex('notes')
            .where({ id })
            .update(newNoteFields)
    },

    //insertFolder 

    insertFolder(knex, newFolder) {
        return knex
            .insert(newFolder)
            .into('folders')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    //get folder id is this right?
    getByFolderId(knex, id) {
        return knex.from('folders').select('*').where('id', id).first()
    },

}





module.exports = NotefulService