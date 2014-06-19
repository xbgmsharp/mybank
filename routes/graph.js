var express = require('express');
var router = express.Router();
var multiparty = require('multiparty')
  , http = require('http')
  , util = require('util')
var moment = require('moment');
var mysql  = require('mysql');

/* GET graph page. */
router.get('/', function(req, res) {

  // No date, fallback by default to today -1 year
  date1 = moment().subtract('years', 3).format("YYYY-MM-DD");
  date2 = moment().format("YYYY-MM-DD");

  res.render('graph', { 'date1': date1, 'date2': date2, title: 'My Bank v0.2' });
});

/* POST graph page. */
router.post('/', function(req, res) {

  var form = new multiparty.Form();
  form.parse(req, function(err, fields, files) {

      //res.send(util.inspect({fields: fields, files: files}), {'Content-Type': 'text/plain'}, 200);

      // Mysql Connect
      var connection = mysql.createConnection('mysql://root:admin@localhost/accounts?dateStrings=true&stringifyObjects=true');
      //var connection = mysql.createConnection('mysql://root:kaya21@localhost:3307/comptes?dateStrings=true&stringifyObjects=true');

      connection.connect(function(err) {
         if (err) {
            console.error('error connecting: ' + err.stack);
            return;
         }
         console.log('connected as id ' + connection.threadId);
      });

      // Create DB query
      var sql = "SELECT SUM( Montant ) AS Total, DATE_FORMAT( `Date` , '%b' ) AS Mois, DATE_FORMAT( `Date` , '%Y' ) AS Year FROM `current` WHERE `Desc` LIKE '%salaire%' GROUP BY MONTH( Date ) , YEAR( Date ) ORDER BY `Date` ASC";
/*
      var sql = "SELECT SUM(Montant) as Total FROM `current` WHERE";
      if (fields.date1[0] && fields.date1[0] != ""){
            sql += " `Date` >= '"+ fields.date1[0] +"' AND `Date` <= '"+ fields.date2[0] +"' ";
      } else {
            sql += " `Date` >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) AND `Date` <= CURDATE() ";
      }
      if (fields.desc[0] && fields.desc[0] != "") {
            sql += " AND `Desc` Like '%"+ fields.desc[0] +"%' ";
      }
      sql += " GROUP by MONTH(Date), YEAR(Date) ORDER BY `Date` ASC ";
*/
      var query = connection.query(sql, function(err, rows, fields) {
          if (err) throw err;
          //console.log('The fields: ', fields);
          console.log('The rows: ', rows);
          var json = new Array();
          for (var i in rows)
          {
              json.push([rows[i].Total]);
          }
          json = JSON.stringify(json);
          console.log('The rows: ', json);
          res.send(json, {'Content-Type': 'text/plain'}, 200);
      });
      console.log(query.sql);
      connection.end();
  });

});


module.exports = router;
