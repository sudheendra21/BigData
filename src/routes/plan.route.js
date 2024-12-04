const express = require('express');
const {
    planController
} = require('../controllers');
//const auth = require('../middlewares/auth');
const { auth } = require('../services/auth.service');

const router = express.Router();

router
    .route('/')
    .post(auth,planController.createPlan);

router
    .route('/:objectId')
    .get(auth, planController.getPlan)
    .delete(auth, planController.deletePlan)
    .put(auth, planController.putPlan)
    .patch(auth, planController.patchPlan)

module.exports = router;