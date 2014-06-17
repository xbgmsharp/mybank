var express = require('express');
var router = express.Router();

/* GET about page. */
router.get('/', function(req, res) {
  res.render('about', { title: 'My Bank v0.2' });
});

module.exports = router;
