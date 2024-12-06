const status = require('http-status');
const {
    ifKeyExists,
    getETag
} = require("../services/redis.service");
const config = require("../../config/local.json");
const {
    isValidJSONSchema
} = require('../services/jsonSchema.service');

const { makeSchemaOptional } = require("../utils/helper");

const PLAN_SCHEMA = require("../models/plan.model");
const {
    createSavePlan,
    getSavedPlan,
    deleteSavedPlan,
    generateETag,
    getAllPlans
} = require('../services/plan.service');

//const rabbit = require("../services/rabbitmq.service");

const getAll = async (req, res) => {
    try {
        const data = await getAllPlans(); // Call service layer to get all plans
        res.status(status.OK).json(data); // 200 OK with all the data
    } catch (err) {
        res.status(status.INTERNAL_SERVER_ERROR).json({ message: err.message }); // Handle errors
    }
};

const getPlan = async (req, res) => {
    console.log("Executing the GET method.");
    try {
        const {
            objectId
        } = req.params;

        // create key in the format - <type>_<objectId>
        const KEY = `${config.PLAN_TYPE}_${objectId}`;

        // Check if the KEY is present in the database(redis)
        const isKeyValid = await ifKeyExists(KEY);
        console.log(`Key to deal with: ${KEY}`);

        // check for valid objectId
        if (!isKeyValid) {
            console.log(`${KEY}: not valid!`)
            return res.status(status.NOT_FOUND).send({
                message: `Invalid ObjectId! - ${objectId}`,
                value: objectId,
                type: "Invalid"
            });
        }

        const eTag = await getETag(KEY);

        const urlETag = req.headers['If-None-Match'];
        if (!!urlETag && urlETag.equals(eTag)) {
            console.log(`${eTag}: ETag present.`);
            res.setHeader('ETag', eTag);
            return res.status(status.NOT_MODIFIED);
        }
        console.log("Saving Plan...");
        const plan = await getSavedPlan(KEY);
        console.log("Saved successfully!!")
        res.setHeader('ETag', eTag);
        return res.status(status.OK).send(plan);
    } catch (error) {
        return res.status(status.UNAUTHORIZED).send({
            message: "Something went wrong!!"
        });
    }
}

const createPlan = async (req, res) => {
    console.log("Executing the POST method.");
    try {
        const planJSON = req.body;
        if (!!!planJSON) {
            return res.status(status.BAD_REQUEST).send({
                message: "Invalid body!",
                type: "Invalid"
            });
        }

        console.log("Validating JSON body")
        const isValidSchema = await isValidJSONSchema(planJSON, PLAN_SCHEMA);

        if (isValidSchema?.error) {
            console.log("Invalid JSON");
            return res.status(status.BAD_REQUEST).send({
                message: "Invalid Schema!",
                type: "Invalid",
                ...isValidSchema?.data
            })
        }

        console.log("Valid JSON");
        const KEY = `${config.PLAN_TYPE}_${planJSON.objectId}`;


        console.log(`Checking for ${KEY} validation!`)
        const isKeyValid = await ifKeyExists(KEY);
        if (isKeyValid) {
            console.log(`${KEY}: not valid!`)
            return res.status(status.CONFLICT).send({
                message: `Plan already exist! - ${planJSON.objectId}`,
                type: "Already Exists"
            });
        }
        console.log("Creating plan..")
        await createSavePlan(KEY, planJSON);
        const eTag = generateETag(KEY, planJSON);

        console.log("sending message to queue....")
        // Send Message to Queue for Indexing
        const message = {
            operation: "STORE",
            body: planJSON,
        }
        //rabbit.producer(message);

        console.log(`${planJSON.objectId}: Plan created successfully!`);

        res.setHeader('ETag', eTag);

        return res.status(status.OK).send({
            message: "Plan created successfully",
            objectId: planJSON.objectId
        })
    } catch (error) {
        console.log(error);
        return res.status(status.UNAUTHORIZED).send({
            message: "Something went wrong!!"
        });
    }
}

const deletePlan = async (req, res) => {
    try {
        const {
            objectId
        } = req.params;
        console.log("Executing the DELETE method.")

        // create key in the format - <type>_<objectId>
        const KEY = `${config.PLAN_TYPE}_${objectId}`;

        console.log(`Key to deal with: ${KEY}`);

        // Check if the KEY is present in the database(redis)
        const isKeyValid = await ifKeyExists(KEY);

        // check for valid objectId
        if (!isKeyValid) {
            console.log(`${KEY}: not valid!`)
            return res.status(status.NOT_FOUND).send({
                message: `Invalid ObjectId! - ${objectId}`,
                value: objectId,
                type: "Invalid"
            });
        }

        console.log("sending message to queue....")

        const oldPlan = await getSavedPlan(KEY);
        // Send Message to Queue for Indexing
        const message = {
            operation: "DELETE",
            body: oldPlan
        }
        //rabbit.producer(message);

        console.log("Deleting plan...");
        await deleteSavedPlan(KEY);
        console.log("Plan Deleted successfully!!");

        return res.status(status.OK).send({
            message: "Plan deleted successfully",
            objectId
        })
    } catch (error) {
        return res.status(status.UNAUTHORIZED).send({
            message: "Something went wrong!!"
        });
    }
}

const putPlan = async (req, res) => {
    try {
        const {
            objectId
        } = req.params;
        const planJSON = req.body;

        console.log("Executing the PUT method.")

        // create key in the format - <type>_<objectId>
        const KEY = `${config.PLAN_TYPE}_${objectId}`;

        console.log(`Key to deal with: ${KEY}`);

        // Check if the KEY is present in the database(redis)
        const isKeyValid = await ifKeyExists(KEY);

        // check for valid objectId
        if (!isKeyValid) {
            console.log(`${KEY}: not valid!`)
            return res.status(status.NOT_FOUND).send({
                message: `Invalid ObjectId! - ${objectId}`,
                value: objectId,
                type: "Invalid"
            });
        }

        // If invalid body
        if (!!!planJSON) {
            return res.status(status.BAD_REQUEST).send({
                message: "Invalid body!",
                type: "Invalid"
            });
        }

        console.log("Validating JSON body")
        const isValidSchema = await isValidJSONSchema(planJSON, PLAN_SCHEMA);

        if (isValidSchema?.error) {
            console.log("Invalid JSON");
            return res.status(status.BAD_REQUEST).send({
                message: "Invalid Schema!",
                type: "Invalid",
                ...isValidSchema?.data
            })
        }

        console.log("Get ETag and check for If-Match")
        const urlETag = req.headers['if-match'] || [];
        if (urlETag && !urlETag.length) {
            return res.status(status.NOT_FOUND).send({
                message: "Etag not provided!"
            });
        }

        const eTag = await getETag(KEY);

        if (urlETag !== eTag) {
            res.setHeader('ETag', eTag)
            return res.status(status.PRECONDITION_FAILED).send();
        }

        const oldPlan = await getSavedPlan(KEY);
        console.log("sending message to queue....")

        // Send Message to Queue for Indexing
        const message = {
            operation: "DELETE",
            body: oldPlan
        }
        //rabbit.producer(message);

        await deleteSavedPlan(KEY);
        console.log("Create new ETag");
        await createSavePlan(KEY, planJSON);
        const eTagNew = generateETag(KEY, planJSON);

        console.log("Saved successfully!!");
        console.log("Get Saved plan");
        const plan = await getSavedPlan(KEY);

        // Send Message to Queue for Indexing
        message = {
            operation: "STORE",
            body: plan
        }
        //rabbit.producer(message);
        res.setHeader('ETag', eTagNew);
        return res.status(status.OK).send(plan);
    } catch (error) {
        console.log(JSON.stringify(error))
        return res.status(status.UNAUTHORIZED).send({
            message: "Something went wrong!!"
        });
    }
}

const patchPlan = async (req, res) => {
    try {
        const {
            objectId
        } = req.params;
        const planJSON = req.body;

        console.log("Executing the PATCH method.")

        // create key in the format - <type>_<objectId>
        const KEY = `${config.PLAN_TYPE}_${objectId}`;

        console.log(`Key to deal with: ${KEY}`);

        // Check if the KEY is present in the database(redis)
        const isKeyValid = await ifKeyExists(KEY);

        // check for valid objectId
        if (!isKeyValid) {
            console.log(`${KEY}: not valid!`)
            return res.status(status.NOT_FOUND).send({
                message: `Invalid ObjectId! - ${objectId}`,
                value: objectId,
                type: "Invalid"
            });
        }

        // If invalid body
        if (!!!planJSON) {
            return res.status(status.BAD_REQUEST).send({
                message: "Invalid body!",
                type: "Invalid"
            });
        }

        console.log("Validating JSON body")

        const patchSchema = JSON.parse(JSON.stringify(PLAN_SCHEMA));
        makeSchemaOptional(patchSchema);

        const isValidSchema = await isValidJSONSchema(planJSON, PLAN_SCHEMA);

        if (isValidSchema?.error) {
            console.log("Invalid JSON");
            return res.status(status.BAD_REQUEST).send({
                message: "Invalid Schema!",
                type: "Invalid",
                ...isValidSchema?.data
            })
        }

        console.log("Get ETag and check for If-Match")
        const urlETag = req.headers['if-match'] || [];
        if (urlETag && !urlETag.length) {
            return res.status(status.NOT_FOUND).send({
                message: "Etag not provided!"
            });
        }

        const eTag = await getETag(KEY);

        if (urlETag !== eTag) {
            res.setHeader('ETag', eTag)
            return res.status(status.PRECONDITION_FAILED).send();
        }

        console.log("Create new ETag");
        console.log("urlETag: ", urlETag);
        console.log("eTag: ", eTag);

        await createSavePlan(KEY, planJSON);
        console.log("After create Save Plan");
        const eTagNew = generateETag(KEY, planJSON);

        console.log("Saved successfully!!");
        console.log("Get Saved plan");
        const plan = await getSavedPlan(KEY);

        // Send Message to Queue for Indexing
        const message = {
            operation: "STORE",
            body: plan
        }
        //rabbit.producer(message);

        res.setHeader('ETag', eTagNew);
        return res.status(status.OK).send(plan);
    } catch (error) {
        console.log(error)
        console.log(JSON.stringify(error))
        return res.status(status.UNAUTHORIZED).send({
            message: "Something went wrong!!"
        });
    }
}

module.exports = {
    getPlan,
    getAll,
    createPlan,
    deletePlan,
    putPlan,
    patchPlan
}