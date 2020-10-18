const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeNotesArray } = require('./test/noteful.fixtures')

describe.only('Notes Endpoints', function () {
    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('notes').truncate())

    afterEach('cleanup', () => db('notes').truncate())

    describe(`GET /api/noteful`, () => {
        context(`Given no notes`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/noteful')
                    .expect(200, [])
            })
            context('Given there are notes in the database', () => {
                const testNotes = makeNotesArray()

                beforeEach('insert notes', () => {
                    return db
                        .into('notes')
                        .insert(testNotes)
                })

                it('responds with 200 and all of the notes', () => {
                    return supertest(app)
                        .get('/api/noteful')
                        .expect(200, testNotes)
                })
            })
        })

        context(`Given an XSS attack note`, () => {
            const maliciousArticle = {
                id: 911,
                name: 'Naughty naughty very naughty <script>alert("xss");</script>',
                content: 'this is a note',
                folder: 1,
            }
            beforeEach('insert malicious note', () => {
                return db
                    .into('noteful')
                    .insert([maliciousArticle])
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/noteful/${maliciousNote.id}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.name).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                        expect(res.body.content).to.eql('this is a note')
                        expect(res.body.description).to.eql('Folder')
                    })
            })
        })

        describe(`GET /api/noteful/:note_id`, () => {

            context(`Given no notes`, () => {
                it(`responds with 404`, () => {
                    const noteId = 123456
                    return supertest(app)
                        .get(`/api/noteful/${noteId}`)
                        .expect(404, { error: { message: `Note doesn't exist` } })
                })
            })

            context('Given there are notes in the database', () => {
                const testNotes = makeNotessArray()

                beforeEach('insert notes', () => {
                    return db
                        .into('notes')
                        .insert(testNotes)
                })

                it('responds with 200 and the specified note', () => {
                    const noteId = 2
                    const expectedNote = testNotes[noteId - 1]
                    return supertest(app)
                        .get(`/api/noteful/${noteId}`)
                        .expect(200, expectedNote)
                })
            })
        })

        describe.only(`POST api/noteful`, () => {
            it(`creates a note, responding with 201 and the new note`, function () {
                this.retries(3)
                const newNote = {
                    title: 'Note',
                    content: 'this is a note',
                    folder: '1',

                }
                return supertest(app)
                    .post('/api/noteful')
                    .send(newNote
                        .expect(201)
                        .expect(res => {
                            expect(res.body.title).to.eql(newNote.name)
                            expect(res.body.content).to.eql(newNote.content)
                            expect(res.body.rating).to.eql(newNote.folder)
                            expect(res.body).to.have.property('id')
                            expect(res.headers.location).to.eql(`/api/noteful/${res.body.id}`)
                            const expected = new Date().toLocaleString('en', { timeZone: 'UTC' })
                            const actual = new Date(res.body.date_published).toLocaleString()
                            expect(actual).to.eql(expected)
                        })
            })
                .then(postRes =>
                    supertest(app)
                        .get(`api/noteful/${postRes.body.id}`)
                        .expect(postRes.body)
                )
        })
        const requiredFields = ['name', 'content', 'folder']

        requiredFields.forEach(field => {
            const newNote = {
                title: 'Note',
                content: 'this is a note',
                folder: '1',
            }
            it(`responds with 400 and an error message when the '${field}' is missing`, () => {
                delete newNote[field]

                return supertest(app)
                    .post('/api/noteful')
                    .send(newNote)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
                    })
            })
        })
    })

    describe.only(`DELETE /api/noteful/note_id`, () => {
        describe.only(`PATCH /api/noteful/:note_id`, () => {
            context(`Given no notes`, () => {
                it(`responds with 404`, () => {
                    const noteId = 123456
                    return supertest(app)
                        .patch(`/api/noteful/${noteId}`)
                        .expect(404, { error: { message: `note doesn't exist` } })
                })
            })
        })
        context('Given there are notes in the database', () => {
            const testNotes = makeNotesArray()

            beforeEach('insert notes', () => {
                return db
                    .into('notes')
                    .insert(testNotes)
            })

            it('responds with 204 and updates the note', () => {
                const idToUpdate = 2
                const updateNote = {
                    title: 'Note',
                    content: 'this is a note',
                    folder: '1',
                }

                const expectedNote = {
                    ...testNotes[idToUpdate - 1],
                    ...updateNote
                }
                return supertest(app)
                    .patch(`/api/noteful/${idToUpdate}`)
                    .send(updateNote)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/noteful/${idToUpdate}`)
                            .expect(expectedNote)
                    )
            })

            it(`responds with 400 when no required fields supplied`, () => {
                const idToUpdate = 2
                return supertest(app)
                    .patch(`/api/noteful/${idToUpdate}`)
                    .send({ irrelevantField: 'foo' })
                    .expect(400, {
                        error: {
                            message: `Request body must contain either 'name' 'content' 'folder'`
                        }
                    })
            })

            it(`responds with 204 when updating only a subset of fields`, () => {
                const idToUpdate = 2
                const updateNote = {
                    title: 'updated note title',
                }
                const expectedNote = {
                    ...testNotes[idToUpdate - 1],
                    ...updateNote
                }

                return supertest(app)
                    .patch(`/api/noteful/${idToUpdate}`)
                    .send({
                        ...updateNote,
                        fieldToIgnore: 'should not be in GET response'
                    })
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/noteful/${idToUpdate}`)
                            .expect(expectedNote)
                    )
            })
        })


        context(`Given no notes`, () => {
            it(`responds with 404`, () => {
                const noteId = 123456
                return supertest(app)
                    .delete(`/api/noteful/${noteId}`)
                    .expect(404, { error: { message: `Note doesn't exist` } })
            })
        })

        context('Given there are notes in the database', () => {
            const testNotes = makeNotesArray()

            beforeEach('insert notes', () => {
                return db
                    .into('notes')
                    .insert(testNotes)
            })

            it('responds with 204 and removes the note', () => {
                const idToRemove = 2
                const expectedNotes = testNotes.filter(note => note.id !== idToRemove)
                return supertest(app)
                    .delete(`/api/noteful/${idToRemove}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/noteful`)
                            .expect(expectedNotes)
                    )
            })
        })

    })
})