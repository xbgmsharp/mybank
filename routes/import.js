var express = require('express');
var router = express.Router();
var mysql  = require('mysql');
var fs = require('fs');
var csv = require('fast-csv');
var multiparty = require('multiparty')
  , http = require('http')
  , util = require('util')

/* GET home page. */
router.get('/', function(req, res) {

	res.render('import', { title: 'My bank life' });
});

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

	var form = new multiparty.Form();
	form.parse(req, function(err, fields, files) {
		res.writeHead(200, {'content-type': 'text/plain'});
		res.write('received upload:\n\n');
		console.log(files);
		var stream = fs.createReadStream(files.upfile[0].path);
		var csvStream = csv({delimiter:'\t', quote:'"', headers : ["Date", "Op", "Montant"]})
		 .on("record", function(data){
			if (!data.Date.match(/^Compte/)) {
			 	console.log(data);
				data.Desc = "";
				if (data.Op.match(/COLT/)) { data.Desc = "Salaire"; }
				else if (data.Op.match(/TRESOR PUBLIC/)) { data.Desc = "Impot"; }
				else if (data.Op.match(/D.G.F.I.P./)) { data.Desc = "Impot"; }
				else if (data.Op.match(/CARDIF/)) { data.Desc = "Pret"; }
				else if (data.Op.match(/^ECHEANCE PRET/)) { data.Desc = "Pret"; }
				else if (data.Op.match(/ORANGE/)) { data.Desc = "Telephone"; }
				else if (data.Op.match(/FREE TELECOM/)) { data.Desc = "Internet"; }
				else if (data.Op.match(/RATP/)) { data.Desc = "Carte orange"; }
				else if (data.Op.match(/MR LE DREZEN YANN/)) { data.Desc = "Loyer FR"; }
				else if (data.Op.match(/^VIREMENT ETRANGER RECU/)) { data.Desc = "Economie Espagne"; }
				else if (data.Op.match(/^VIRT CPTE A CPTE/)) { data.Desc = "Economie Livret A"; }
	
				var queryString = "INSERT INTO current (`Id`, `Date`, `Op`, `Montant`,  `Desc`, `Country`) SELECT * FROM (SELECT ?,?,?,?,?,?) AS tmp WHERE NOT EXISTS (    SELECT Date FROM current WHERE Date = ? and Op= ?) LIMIT 1";
				var query = connection.query(queryString, ["NULL", data.Date, data.Op, data.Montant, data.Desc, "FR", data.Date, data.Op], function(err, rows) {
		        	        console.log('The INSERT are date ['+ data.Date +'] and Op['+ data.Op+'] and Montant['+ data.Montant +']');
	        	        	if (err) throw err;
		                	console.log('The insert row is: ', rows.insertId);
				});
				console.log(query.sql);
			}
		 })
		 .on("end", function(){
		 	console.log("done");
		 });
		 stream.pipe(csvStream);
		
		fs.unlink(files.upfile[0].path, function(err) {
		        if(err) console.error(err.stack);
		});
		res.end(util.inspect({fields: fields, files: files}));
	});

	//res.send("", {'Content-Type': 'text/plain'}, 200);
	//res.send();
});

module.exports = router;
