module.exports = {
    "definitions": {},
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "http://example2.com/root.json",
    "type": "object",
    "title": "The Plan Schema",
    "required": [
 
    ],
    "properties": {
        "planCostShares": {
            "$id": "#/properties/planCostShares",
            "type": "object",
            "title": "The PlanCostShares Schema",
            "required": [
                "deductible",
                "_org",
                "copay",
                "objectId",
                "objectType"
            ],
            "properties": {
                "deductible": {
                    "$id": "#/properties/planCostShares/properties/deductible",
                    "type": "integer",
                    "title": "The deductible Schema",
                    "default": 0,
                    "examples": [
                        2000
                    ],
                },
                "_org": {
                    "$id": "#/properties/planCostShares/properties/_org",
                    "type": "string",
                    "title": "The _org Schema",
                    "default": "",
                    "examples": [
                        "example.com"
                    ],
                    "pattern": "^(.*)$",
                },
                "copay": {
                    "$id": "#/properties/planCostShares/properties/copay",
                    "type": "integer",
                    "title": "The copay Schema",
                    "default": 0,
                    "examples": [
                        23
                    ],
                },
                "objectId": {
                    "$id": "#/properties/planCostShares/properties/objectId",
                    "type": "string",
                    "title": "The objectId Schema",
                    "default": "",
                    "examples": [
                        "1234vxc2324sdf-501"
                    ],
                    "pattern": "^(.*)$"
                },
                "objectType": {
                    "$id": "#/properties/planCostShares/properties/objectType",
                    "type": "string",
                    "title": "The objectType Schema",
                    "default": "",
                    "examples": [
                        "membercostshare"
                    ],
                    "pattern": "^(.*)$"
                }
            }
        },
        "linkedPlanServices": {
            "$id": "#/properties/linkedPlanServices",
            "type": "array",
            "title": "The LinkedPlanServices Schema",
            "items": {
                "$id": "#/properties/linkedPlanServices/items",
                "type": "object",
                "title": "The Items Schema",
                "required": [
                    "linkedService",
                    "planserviceCostShares",
                    "_org",
                    "objectId",
                    "objectType"
                ],
                "properties": {
                    "linkedService": {
                        "$id": "#/properties/linkedPlanServices/items/properties/linkedService",
                        "type": "object",
                        "title": "The LinkedService Schema",
                        "required": [
                            "_org",
                            "objectId",
                            "objectType",
                            "name"
                        ],
                        "properties": {
                            "_org": {
                                "$id": "#/properties/linkedPlanServices/items/properties/linkedService/properties/_org",
                                "type": "string",
                                "title": "The _org Schema",
                                "default": "",
                                "examples": [
                                    "example.com"
                                ],
                                "pattern": "^(.*)$"
                            },
                            "objectId": {
                                "$id": "#/properties/linkedPlanServices/items/properties/linkedService/properties/objectId",
                                "type": "string",
                                "title": "The objectId Schema",
                                "default": "",
                                "examples": [
                                    "1234520xvc30asdf-502"
                                ],
                                "pattern": "^(.*)$"
                            },
                            "objectType": {
                                "$id": "#/properties/linkedPlanServices/items/properties/linkedService/properties/objectType",
                                "type": "string",
                                "title": "The objectType Schema",
                                "default": "",
                                "examples": [
                                    "service"
                                ],
                                "pattern": "^(.*)$"
                            },
                            "name": {
                                "$id": "#/properties/linkedPlanServices/items/properties/linkedService/properties/name",
                                "type": "string",
                                "title": "The name Schema",
                                "default": "",
                                "examples": [
                                    "Yearly physical"
                                ],
                                "pattern": "^(.*)$"
                            }
                        }
                    },
                    "planserviceCostShares": {
                        "$id": "#/properties/linkedPlanServices/items/properties/planserviceCostShares",
                        "type": "object",
                        "title": "The planserviceCostShares Schema",
                        "required": [
                            "deductible",
                            "_org",
                            "copay",
                            "objectId",
                            "objectType"
                        ],
                        "properties": {
                            "deductible": {
                                "$id": "#/properties/linkedPlanServices/items/properties/planserviceCostShares/properties/deductible",
                                "type": "integer",
                                "title": "The Deductible Schema",
                                "default": 0,
                                "examples": [
                                    10
                                ]
                            },
                            "_org": {
                                "$id": "#/properties/linkedPlanServices/items/properties/planserviceCostShares/properties/_org",
                                "type": "string",
                                "title": "The _org Schema",
                                "default": "",
                                "examples": [
                                    "example.com"
                                ],
                                "pattern": "^(.*)$"
                            },
                            "copay": {
                                "$id": "#/properties/linkedPlanServices/items/properties/planserviceCostShares/properties/copay",
                                "type": "integer",
                                "title": "The Copay Schema",
                                "default": 0,
                                "examples": [
                                    0
                                ]
                            },
                            "objectId": {
                                "$id": "#/properties/linkedPlanServices/items/properties/planserviceCostShares/properties/objectId",
                                "type": "string",
                                "title": "The objectId Schema",
                                "default": "",
                                "examples": [
                                    "1234512xvc1314asdfs-503"
                                ],
                                "pattern": "^(.*)$"
                            },
                            "objectType": {
                                "$id": "#/properties/linkedPlanServices/items/properties/planserviceCostShares/properties/objectType",
                                "type": "string",
                                "title": "The objectType Schema",
                                "default": "",
                                "examples": [
                                    "membercostshare"
                                ],
                                "pattern": "^(.*)$"
                            }
                        }
                    },
                    "_org": {
                        "$id": "#/properties/linkedPlanServices/items/properties/_org",
                        "type": "string",
                        "title": "The _org Schema",
                        "default": "",
                        "examples": [
                            "example.com"
                        ],
                        "pattern": "^(.*)$"
                    },
                    "objectId": {
                        "$id": "#/properties/linkedPlanServices/items/properties/objectId",
                        "type": "string",
                        "title": "The objectId Schema",
                        "default": "",
                        "examples": [
                            "27283xvx9asdff-504"
                        ],
                        "pattern": "^(.*)$"
                    },
                    "objectType": {
                        "$id": "#/properties/linkedPlanServices/items/properties/objectType",
                        "type": "string",
                        "title": "The objectType Schema",
                        "default": "",
                        "examples": [
                            "planservice"
                        ],
                        "pattern": "^(.*)$"
                    }
                }
            }
        },
        "_org": {
            "$id": "#/properties/_org",
            "type": "string",
            "title": "The _org Schema",
            "default": "",
            "examples": [
                "example.com"
            ],
            "pattern": "^(.*)$"
        },
        "objectId": {
            "$id": "#/properties/objectId",
            "type": "string",
            "title": "The objectId Schema",
            "default": "",
            "examples": [
                "12xvxc345ssdsds-508"
            ],
            "pattern": "^(.*)$"
        },
        "objectType": {
            "$id": "#/properties/objectType",
            "type": "string",
            "title": "The objectType Schema",
            "default": "",
            "examples": [
                "plan"
            ],
            "pattern": "^(.*)$"
        },
        "planType": {
            "$id": "#/properties/planType",
            "type": "string",
            "title": "The planType Schema",
            "default": "",
            "examples": [
                "inNetwork"
            ],
            "pattern": "^(.*)$"
        },
        "creationDate": {
            "$id": "#/properties/creationDate",
            "type": "string",
            "title": "The creationDate Schema",
            "default": "",
            "examples": [
                "12-12-2017"
            ],
            "pattern": "^(.*)$"
        }
    }
}