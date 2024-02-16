const createDBCollectionSchema = async (DBSchema, file) => {
    DBSchema.DBCollections.forEach((collection) => {
        let collectionSchema = {};
        let collectionObjects = file[collection];

        if (collectionObjects.length > 0) {
            let sampleObject = collectionObjects[0];
            checDBSchemakDeeply(sampleObject, collectionSchema);
        }
        DBSchema.DBCollectionsSchema[collection] = collectionSchema;
    });

    return DBSchema.DBCollectionsSchema;
}

const checDBSchemakDeeply = (obj, collectionSchema) => {
    for (let key in obj) {
        if(typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            collectionSchema[key] = {};
            checDBSchemakDeeply(obj[key], collectionSchema[key]);
        }
        else {
            collectionSchema[key] = typeof obj[key];
        }
    }
}

const checkContentDeeply = (content, schema) => {
    for(let key in schema) {
        if(typeof schema[key] === 'object' && schema[key] !== null && !Array.isArray(schema[key])) {
            if(!checkContentDeeply(content[key], schema[key])){
                return false;
            }
        } 
        else {
            if(typeof content[key] !== schema[key]) {
                return false;
            }
        }
    }
    return true;
}

module.exports = {
    createDBCollectionSchema,
    checkContentDeeply
}

