const express = require('express');
const router = express.Router();

// @route  GET api/posts/test
// @desc   Tests porst route
// @access Public 
router.get('/test', (req, res)=> res.json({mgs: "Posts Works"}));

module.exports = router