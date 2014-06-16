var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('cortal', { title: 'My Bank v0.1' });
});

module.exports = router;
