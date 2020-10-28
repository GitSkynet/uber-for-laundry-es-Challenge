var express = require('express');
var router = express.Router();
const withAuth = require("../helpers/middleware");

/* GET home page. */
router.get('/', withAuth, function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
