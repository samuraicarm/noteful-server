CREATE TYPE folder_category AS ENUM (
    'Important',
    'Super',
    'Spangley',
 
);

ALTER TABLE notes
  ADD COLUMN
    folder folder_category;