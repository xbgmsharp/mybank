var express = require('express');
var router = express.Router();
var moment = require('moment');
var mysql  = require('mysql');

/* GET report page. */
router.get('/', function(req, res) {

	var date1 = "";
	var date2 = "";

	// Mysql Connect
	var connection = mysql.createConnection('mysql://root:admin@localhost/accounts?dateStrings=true');
        //var connection = mysql.createConnection('mysql://root:kaya21@localhost:3307/comptes?dateStrings=true&stringifyObjects=true');

	connection.connect(function(err) {
	  if (err) {
	    console.error('error connecting: ' + err.stack);
            res.render('error', { "message" : "Error connecting to database", "error" : err});
	    return;
	  }
	  console.log('connected as id ' + connection.threadId);
	});

	// If no date fallback by default to today -1 year
	if (!req.query.date1 || !req.query.date2) {
		date1 = moment().subtract('years', 1).format("YYYY-MM-DD");
		date2 = moment().format("YYYY-MM-DD");
	} else {
		date1 = req.query.date1;
		date2 = req.query.date2;
	}

	// List all records between date
	console.log('The filter date1 is:', date1);
	// Create DB query
	var sql = "SELECT * FROM `current` WHERE";
	if (date1 && date1 != ""){
		sql += " `Date` >= ? AND `Date` <= ? ";
	} else {
		sql += " `Date` >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) AND `Date` <= CURDATE() ";
	}
	if (req.query.desc && req.query.desc != "") {
		sql += " AND `Desc` Like '%"+ req.query.desc +"%' ";
	}
	if (req.query.country && req.query.country != "") {
		sql += " AND `Country` = '"+ req.query.country +"' ";
	}
	sql += " ORDER BY `Date` DESC ";
	var query = connection.query(sql, [date1, date2], function(err, rows) {

		if (err) { // throw err;
			console.error('error connecting: ' + err.stack);
			res.render('error', { "message" : "Query database error", "error" : err});
			return;
		}

		console.log('The filter are date1>='+ date1 +' and date2<='+ date2);
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
		res.render('report', { "items" : rows, "date1": date1, "date2": date2, "desc": req.query.desc });
	});
	console.log(query.sql);

	connection.end();
});

module.exports = router;
