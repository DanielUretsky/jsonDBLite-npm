const fs = require('fs').promises;
const { v4 } = require('uuid');
const classUtils = require('./classUtils');

class jsonDB {
    static #file;
    static #path;
    static #DBSchema;

    /*Validation methoods */
    static async #fileValidator() {
        try {
            const fileCollectionsKeys = Object.keys(jsonDB.#file);

            for (let key in fileCollectionsKeys) {
                let collection = jsonDB.#file[fileCollectionsKeys[key]];

                if (!Array.isArray(collection))
                    throw new Error(`Your collection ${fileCollectionsKeys[key]} must be an Array.`);
                if (typeof collection[0] !== 'object' || collection[0] === null || Array.isArray(collection[0]))
                    throw new Error(`Your collection ${fileCollectionsKeys[key]} must contain object = {}.`);
                if (Object.keys(collection[0]).length === 0)
                    throw new Error('your object cannot be empty.');
            }
        } catch (err) {
            throw err;
        }

    };

    static async #contentValidator(collectionName, content) {
        try {
            const collection = jsonDB.#file[collectionName][0];
            const collectionKeys = Object.keys(collection);
            const contentCollectionKeys = Object.keys(content);

            if (contentCollectionKeys.length !== collectionKeys.length)
                throw new Error(`The number of rows => ${contentCollectionKeys.length} does not match the number of rows in the DB expected => ${collectionKeys.length}`);

            for (let key in contentCollectionKeys) {
                let currentKey = contentCollectionKeys[key];

                if (!collectionKeys.includes(currentKey)) {
                    throw new Error(`Invalid row name => ${contentCollectionKeys[key]} exprected => ${collectionKeys[key]}`);
                }

                const expectedSchema = jsonDB.#DBSchema.DBCollectionsSchema[collectionName][currentKey];
                const currentContent = content[currentKey];
           
                if (typeof expectedSchema === 'object' && expectedSchema !== null && !Array.isArray(expectedSchema)) {
                    if (!classUtils.checkContentDeeply(currentContent, expectedSchema)) {
                        throw new Error(`Invalid datatypes in nested object for key => ${currentKey}`);
                    }
                } 
                else {
                    if (typeof currentContent !== expectedSchema) {
                        throw new Error(`Invalid row datatype => ${currentKey}: ${typeof currentContent} expected => ${currentKey}: ${expectedSchema}`);
                    }  
                }
            }
        } catch (err) {
            throw err;
        }
    };

    /* Main */
    static async connectDB(path) {
        try {
            jsonDB.#path = path;
            jsonDB.#file = JSON.parse(await fs.readFile(path, 'utf-8'));
            await jsonDB.#fileValidator();

            const fileKeys = Object.keys(jsonDB.#file);

            for (let key in fileKeys) {
                if (!jsonDB.#file[fileKeys[key]][0].hasOwnProperty('jsonID')) {
                    jsonDB.#file[fileKeys[key]][0] = {
                        jsonID: v4(),
                        ...jsonDB.#file[Object.keys(jsonDB.#file)[key]][0]
                    }

                    await fs.writeFile(path, JSON.stringify({ ...jsonDB.#file }));
                }
            }
            jsonDB.#DBSchema = await jsonDB.#getDBSchema();

            console.log(jsonDB.#DBSchema);
        } catch (err) {
            throw err;
        }
    };

    static async #getDBSchema() {
        try {
            
            const DBCollections = Object.keys(jsonDB.#file);
            const amountOfDBCollections = DBCollections.length;
            const [DBName, DBFormat] = jsonDB.#path.split('/')[jsonDB.#path.split('/').length - 1].split('.');
            
            const DBSchema = {
                DBName,
                DBFormat,
                DBCollections,
                amountOfDBCollections,
                DBCollectionsSchema: {}
            }

            DBSchema.DBCollectionsSchema = await classUtils.createDBCollectionSchema(DBSchema, jsonDB.#file);

            
            return DBSchema;
        } catch (err) {
            throw err;
        }
    };

    /* DB Methoods */
    static async jsonGetAllCollections() {
        try {
            return jsonDB.#file;
        } catch (err) {
            throw err;
        }
    };

    static async jsonGetCollection(collectionName) {
        try {
            if (!jsonDB.#file[collectionName]) {
                throw new Error("Uncorrect collection name");
            };
            return jsonDB.#file[collectionName];
        } catch (err) {
            throw err;
        }
    }

    static async jsonGetOne(collectionName, id) {
        try {
            if (!jsonDB.#file[collectionName])
                throw new Error("Uncorrect collection name");

            const founded = jsonDB.#file[collectionName].find(el => el.jsonID == id);
            return founded;
        } catch (err) {
            throw err;
        }
    }

    static async jsonAdd(collectionName, content) {
        try {
            if (!jsonDB.#file[collectionName])
                throw new Error("Uncorrect collection name");

            content = { jsonID: v4(), ...content };

            await jsonDB.#contentValidator(collectionName, content);
            jsonDB.#file[collectionName].push(content);
            await fs.writeFile(jsonDB.#path, JSON.stringify(jsonDB.#file));

            return content;
        } catch (err) {
            throw err;
        }
    };

    static async jsonFoundOneAndUpdate(collectionName, id, obj) {
        try {
            if (!jsonDB.#file[collectionName])
                throw new Error("Uncorrect collection name");

            const index = jsonDB.#file[collectionName].findIndex(el => el.jsonID == id);
            if (index < 0)
                return;

            const updatedData = { ...jsonDB.#file[collectionName][index], ...obj };

            await jsonDB.#contentValidator(collectionName, updatedData);
            jsonDB.#file[collectionName][index] = updatedData;
            await fs.writeFile(jsonDB.#path, JSON.stringify(jsonDB.#file));

            return updatedData;
        } catch (err) {
            throw err;
        }
    };

    static async jsonDelete(collectionName, id) {
        try {
            if (!jsonDB.#file[collectionName]) {
                throw new Error("Uncorrect collection name");
            };

            const index = jsonDB.#file[collectionName].findIndex(el => el.jsonID == id);
            if (index < 0) {
                return;
            }

            jsonDB.#file[collectionName].splice(index, 1);
            await fs.writeFile(jsonDB.#path, JSON.stringify(jsonDB.#file));
 
            return index;
        } catch (err) {
            throw err;
        }
    };
}

module.exports = jsonDB;




