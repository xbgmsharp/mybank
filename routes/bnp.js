var express = require('express');
var router = express.Router();
var mysql  = require('mysql');

/* GET home page. */
router.get('/', function(req, res) {

	var date1 = "";
	var date2 = "";

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

	// If no date fallback by default to today -1 year
	if (!req.query.date1 || !req.query.date2) {
		// Make MYSQL do the calculation for us
		var queryString = "SELECT CURDATE() AS date2, DATE_SUB(CURDATE(), INTERVAL 1 YEAR) AS date1";
	        connection.query(queryString, function(err, rows) {
			if (err) throw err;
			date1 = rows[0].date1;
			date2 = rows[0].date2;
			console.log('The date is:', date2);
		});
	} else {
		date1 = req.query.date1;
		date2 = req.query.date2;
	}

	// List all records between date
	console.log('The filter date1 is:', date1);
	var queryString = "SELECT * FROM `current` WHERE `Date` >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) AND `Date` <= CURDATE() ORDER BY `Date` DESC";
	if (date1 != ""){
		queryString = "SELECT * FROM `current` WHERE `Date` >= ? AND `Date` <= ? ORDER BY `Date` DESC";
	}
	var query = connection.query(queryString, [date1, date2], function(err, rows) {
		console.log('The filter are date1>='+ date1 +' and date2<='+ date2);
		if (err) throw err;
		console.log('The first row is: ', rows[0]);
		// Assign a class for well know entry base on Op or Desc
		for (var i in rows)
		{
			if (rows[i].Op) {
				if (rows[i].Op.match(/TRESOR PUBLIC/) || rows[i].Op.match(/D.G.F.I.P./)) rows[i].Class = "impot";
				if (rows[i].Op.match(/CARDIF/)) rows[i].Class = "cardif";
				if (rows[i].Op.match(/^INTERETS ET COMMISSIONS PRET/) || rows[i].Op.match(/^ECHEANCE PRET/)) rows[i].Class = "pret";
				if (rows[i].Op.match(/METRO/) || rows[i].Op.match(/RATP/)) rows[i].Class = "ratp";
			}
			if (rows[i].Desc) {
				if (rows[i].Desc.match(/^Salaire/)) rows[i].Class = "salaire";
				if (rows[i].Desc.match(/^Loyer FR/)) rows[i].Class = "loyerfr";
				if (rows[i].Desc.match(/^Loyer ES/)) rows[i].Class = "loyeres";
				if (rows[i].Desc.match(/^Internet/)) rows[i].Class = "internet";
				if (rows[i].Desc.match(/^GIGANEWS/)) rows[i].Class = "giganews";
			}
		}
		res.render('bnp', { "items" : rows, "date1": date1, "date2": date2, title: 'My bank life' });
	});
	console.log(query.sql);

	connection.end();
});

module.exports = router;