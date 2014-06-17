var express = require('express');
var router = express.Router();
var mysql  = require('mysql');

/* GET graph page. */
router.get('/', function(req, res) {

  // If no date fallback by default to today -1 year
  if (!req.query.date1 || !req.query.date2) {
        // Make MYSQL do the calculation for us
        //var queryString = "SELECT CURDATE() AS date2, DATE_SUB(CURDATE(), INTERVAL 1 YEAR) AS date1";
        //connection.query(queryString, function(err, rows) {
        //        if (err) throw err;
                  date1 = "2010-06-01";
                  date2 = "2014-05-01";
        //        console.log('The date is:', date2);
        //});
  } else {
        date1 = req.query.date1;
        date2 = req.query.date2;
  }

  res.render('graph', { 'date1': date1, 'date2': date2, title: 'My Bank v0.2' });
});

/* POST graph page. */
router.post('/', function(req, res) {

  // Mysql Connect
  var connection = mysql.createConnection('mysql://root:admin@localhost/accounts?dateStrings=true');
  //var connection = mysql.createConnection('mysql://root:kaya21@localhost:3307/comptes?dateStrings=true&stringifyObjects=true');

  connection.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      return;
    }
    console.log('connected as id ' + connection.threadId);
  });

  console.log(req.body);

  // Create DB query
  var sql = "SELECT SUM(Montant) as Total, DATE_FORMAT(`Date`, '%b') as Mois FROM `current` WHERE";
  if (req.body.date1 && req.body.date1 != ""){
          sql += " `Date` >= '"+ req.body.date1 +"' AND `Date` <= '"+ req.body.date2 +"' ";
  } else {
          sql += " `Date` >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) AND `Date` <= CURDATE() ";
  }
  if (req.query.desc && req.query.desc != "") {
          sql += " AND `Desc` Like '%"+ req.body.desc +"%' ";
  }
//  if (req.query.country && req.query.country != "") {
//          sql += " AND `Country` = '"+ req.body.country +"' ";
//  }
  sql += " GROUP by MONTH(Date), YEAR(Date) ORDER BY `Date` ASC ";
  var query = connection.query(sql, function(err, rows) {
        //console.log('The filter are date1>='+ date1 +' and date2<='+ date2);
        if (err) throw err;
        console.log('The first row is: ', rows[0]);
	res.send(rows, {'Content-Type': 'text/plain'}, 200);
  });
  console.log(query.sql);

  connection.end();

});


module.exports = router;
