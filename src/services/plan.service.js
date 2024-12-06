const {
    addSetValue,
    hSet,
    deleteKeys,
    getAllValuesByKey,
    sMembers,
    getKeys,
    setETag,
    getTopLevelPlanKeys,
    getKeyType
} = require("./redis.service");
const hash = require('object-hash');

const getSavedPlan = async (key) => {
    const output = await getOrDeletePlanData(key, {}, false);
    return output
}

const createSavePlan = async (key, plan) => {
    await convertJSONToMap(plan);
    return getOrDeletePlanData(key, {}, false);
}

const convertJSONToMap = async (json) => {
    const valueMap = {};
    const map = {};

    for (let [key, value] of Object.entries(json)) {
        const redisKey = `${json["objectType"]}_${json["objectId"]}`;
        if (Array.isArray(value)) {
            value = await convertToList(value);
            for (let [_, valueArray] of Object.entries(value)) {
                for (let [keyInnerArray, _] of Object.entries(valueArray)) {
                    await addSetValue(`${redisKey}_${key}`, keyInnerArray);
                }
            }
        } else if (typeof value === "object") {
            value = await convertJSONToMap(value);
            const calculatedValue = Object.keys(value)[0];
            await addSetValue(`${redisKey}_${key}`, calculatedValue);
        } else {
            await hSet(redisKey, key, value.toString());
            valueMap[key] = value;
            map[redisKey] = valueMap
        }
    }

    return map
}

const convertToList = async (array) => {
    let list = [];
    for (let i = 0; i < array.length; i++) {
        let value = array[i];
        if (Array.isArray(value)) {
            value = await convertToList(value);
        } else if (typeof value === "object") {
            value = await convertJSONToMap((value))
        }
        list.push(value);
    }
    return list;
}


const getOrDeletePlanData = async (redisKey, outputMap, isDelete) => {

    const exactkey = await getKeys(redisKey);
    const patternkey = await getKeys(`${redisKey}_*`);

    const keys = [...exactkey, ...patternkey];
    console.log(`Keys found for pattern ${redisKey}* : `, keys);

    for (let l = 0; l < keys.length; l++) {
        const key = keys[l];
        console.log(`Processing key: ${key}`);

        // Get the type of the current key
        const keyType = await getKeyType(key);
        console.log(`Key type for ${key}: ${keyType}`);

        if (key === redisKey) {
            if (isDelete) {
                console.log(`Deleting key: ${key}`);
                await deleteKeys([key]); // Ensure you await this call
            } else if (keyType === 'hash') {
                // Only try to get values if the key is a hash
                const val = await getAllValuesByKey(key);
                console.log(`Retrieved values for key ${key}:`, val);
                for (let [keyName, _] of Object.entries(val)) {
                    if (keyName.toLowerCase() !== "etag") {
                        outputMap[keyName] = !isNaN(val[keyName]) ? Number(val[keyName]) : val[keyName];
                    }
                }
            }
        } else {
            const newStr = key.substring(`${redisKey}_`.length);
            if (keyType === 'set') {
                const members = [...(await sMembers(key))];
                console.log(`Members found for key ${key}:`, members);

                if (members.length > 1) {
                    const listObj = [];
                    for (let i = 0; i < members.length; i++) {
                        const member = members[i];
                        if (isDelete) {
                            console.log(`Recursively deleting member: ${member}`);
                            await getOrDeletePlanData(member, null, true); // Ensure recursive delete
                        } else {
                            listObj.push(await getOrDeletePlanData(member, {}, false));
                        }
                    }
                    if (isDelete) {
                        console.log(`Deleting key after processing members: ${key}`);
                        await deleteKeys([key]); // Delete the set key itself after processing members
                    } else {
                        outputMap[newStr] = listObj;
                    }
                } else {
                    if (members.length === 1) {
                        const memberKey = members[0];
                        const memberKeyType = await getKeyType(memberKey);
                        console.log(`Key type for member ${memberKey}: ${memberKeyType}`);
                        if (isDelete) {
                            console.log(`Deleting member and key: ${memberKey}, ${key}`);
                            await deleteKeys([memberKey, key]); // Ensure both member and key are deleted
                        } else if (memberKeyType === 'hash') {
                            const val = await getAllValuesByKey(memberKey);
                            const newMap = {};
                            console.log(`Retrieved values for member key ${memberKey}:`, val);

                            for (let [keyName, _] of Object.entries(val)) {
                                newMap[keyName] = !isNaN(val[keyName]) ? Number(val[keyName]) : val[keyName];
                            }

                            outputMap[newStr] = newMap;
                        }
                    }
                }
            } else {
                console.log(`Skipping key ${key} as it is not a set (expected set, found ${keyType})`);
            }
        }
    }

    return outputMap;
};


const deleteSavedPlan = async (key) => {
    await getOrDeletePlanData(key, {}, true);
}

const generateETag = (key, jsonObject) => {
    const eTag = hash(jsonObject);
    setETag(key, eTag);
    return eTag;
}

// Get all plans
const getAllPlans = async () => {
    const output = [];
    const topkeys = await getTopLevelPlanKeys();
  
    for (const topkey of topkeys) {
      const plan = await getSavedPlan(topkey);
      output.push(plan);
    }
    return output;
  };

module.exports = {
    getSavedPlan,
    convertJSONToMap,
    createSavePlan,
    getOrDeletePlanData,
    deleteSavedPlan,
    generateETag,
    getAllPlans
}