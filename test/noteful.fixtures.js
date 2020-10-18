function makeNotesArray() {
    return [
        {
            id: 1,
            name: 'Note1',
            content: 'this is a note',
            folder: 1,
        },
        {
            id: 2,
            name: 'Note2',
            content: 'this is a note',
            folder: 3,
        },
        {
            id: 3,
            name: 'Note3',
            content: 'this is a note',
            folder: 2,
        },
        {
            id: 4,
            name: 'Note4',
            content: 'this is a note',
            folder: 2,
        },
    ];
}

module.exports = { makeNotesArray, }