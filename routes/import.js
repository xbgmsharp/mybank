var express = require('express');
var router = express.Router();
var mysql  = require('mysql');
var fs = require('fs');
var csv = require('fast-csv');
var multiparty = require('multiparty')
  , http = require('http')
  , util = require('util')
var moment = require('moment');
var iconvlite = require('iconv-lite');

/* GET import page. */
router.get('/', function(req, res) {
	res.render('import', { title: 'My Bank v0.2' });
});

/* POST import page. */
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

	function dbinsert(data) {
		var queryString = "INSERT INTO current (`Date`, `Op`, `Montant`,  `Desc`, `Country`) SELECT * FROM (SELECT ?,?,?,?,?) AS tmp WHERE NOT EXISTS ( SELECT Date FROM current WHERE Date=? AND Op=? AND Montant=?) LIMIT 1";
		var query = connection.query(queryString, [data.Date, data.Op, data.Montant, data.Desc, data.Country, data.Date, data.Op, data.Montant], function(err, rows) {
	     	        console.log('The INSERT are date ['+ data.Date +'] and Op['+ data.Op +'] and Montant['+ data.Montant +']');
	               	if (err) throw err;
	              	console.log('The insert row is: ', rows.insertId);
		});

		console.log(query.sql);
	}

	var form = new multiparty.Form();
	form.parse(req, function(err, fields, files) {
		console.log(files);

		if (files.upfile[0].originalFilename.match(/movimientos.csv/)) { // IF BANK ING

		iconvlite.extendNodeEncodings(); // After this call all Node basic primitives will understand iconv-lite encodings.
		var stream = fs.createReadStream(files.upfile[0].path, 'latin1');
		var csvStream2 = csv
		 .fromStream(stream, {delimiter:';', quote:'"', headers: true, headers : ["FECHAOPER", "FECHAVALOR", "Op", "IMPORTE", "SALDO"]})
		 .on("record", function(data){
			if (data.FECHAOPER && data.Op && data.IMPORTE && data.FECHAVALOR && data.SALDO) {
				if (moment(data.FECHAOPER, 'DD/MM/YYYY').isValid() && moment(data.FECHAVALOR, 'DD/MM/YYYY').isValid()) {
					data.Date = moment(data.FECHAOPER, 'DD/MM/YYYY').format('YYYY-MM-DD');
					data.Montant = data.IMPORTE.replace(",", ".").replace(" ", "");
					data.Desc = "";
					data.Country = "ES";
					data.Desc = "";
					if (data.Op.match(/GIGANEWS/)) { data.Desc = "GIGANEWS"; }
					else if (data.Op.match(/NTT/)) { data.Desc = "Salaire"; }
					else if (data.Op.match(/COFIBAR/)) { data.Desc = "Loyes ES"; }
			 		console.log(data);
					dbinsert(data);
				}
			}
		 })
		 .on('error', function(error) {
			console.log('Error ING '+ error);
		 })
		 .on("end", function(){
		 	console.log("done ING");
			res.send("received ID recorsds", {'Content-Type': 'text/plain'}, 200);
		 });
		}

		if (!files.upfile[0].originalFilename.match(/movimientos.csv/) && files.upfile[0].originalFilename.match(/.csv/)) { // IF BANK SABADELL
		var csvStream1 = csv
		 .fromStream(stream, {delimiter:';', quote:'"', headers : ["FECHAOPER", "Op", "FECHAVALOR", "IMPORTE", "SALDO", "REFERENCIA 1", "REFERENCIA 2"]})
		 .on("record", function(data){
			if (data.FECHAOPER && data.Op && data.IMPORTE && data.FECHAVALOR && data.SALDO) {
				if (moment(data.FECHAOPER, 'DD/MM/YYYY').isValid() && moment(data.FECHAVALOR, 'DD/MM/YYYY').isValid() && !moment(data.Op, 'DD/MM/YYYY').isValid()) {
					data.Date = moment(data.FECHAOPER, 'DD/MM/YYYY').format('YYYY-MM-DD');
					data.Montant = data.IMPORTE.replace(",", ".").replace(" ", "");
					data.Country = "ES";
					data.Desc = "";
					if (data.Op.match(/NTT/)) { data.Desc = "Salaire"; }
					else if (data.Op.match (/METRO BARCELONA-BARCELONA/)) { data.Desc = "Carte orange"; }
					else if (data.Op.match (/GIGANEWS/)) { data.Desc = "GIGANEWS"; }
					else if (data.Op.match (/ELECTRICIDAD /)) { data.Desc = "Loyer ES EDF"; }
					else if (data.Op.match (/Gas Natural /)) { data.Desc = "Loyer ES Gaz"; }
					else if (data.Op.match (/LINEA DIRECTA/)) { data.Desc = "Assurance scooter"; }
					else if (data.Op.match (/TRASPASO A 0230-00012789-36/)) { data.Desc = "Loyer ES"; }
					else if (data.Op.match (/AGUA/)) { data.Desc = "Loyer ES AGUA"; }
			 		console.log(data);
					dbinsert(data);
				}
			}
		 })
		 .on('error', function(error) {
			console.log('Error SB '+ error);
		 })
		 .on("end", function(){
		 	console.log("done SB");
			res.send("received SB recorsds", {'Content-Type': 'text/plain'}, 200);
		 });
		}

		if (files.upfile[0].originalFilename.match(/.exl/)) { // IF BANK BNP
		var csvStream3 = csv
		 .fromSteam(stream, {delimiter:'\t', quote:'"', headers : ["Date", "Op", "Montant"]})
		 .on("record", function(data){
			if (!data.Date.match(/^Compte/) && data.Date && data.Op && data.Montant && moment(data.Date, 'YYYY/MM/DD').isValid()) {
			 	console.log(data);
				data.Desc = "";
				data.Country = "FR";
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
				dbinsert(data);
			}
		 })
		 .on('error', function(error) {
			console.log('Error BNP '+ error);
		 })
		 .on("end", function(){
		 	console.log("done BNP");
			res.send("received BNP recorsds", {'Content-Type': 'text/plain'}, 200);
		 });
		}
	
		fs.unlink(files.upfile[0].path, function(err) {
		        if(err) console.error(err.stack);
		});
//		res.writeHead(200, {'content-type': 'text/plain'});
//		res.write('received upload:\n\n');
//		res.end(util.inspect({fields: fields, files: files}));
	});

	//res.send("", {'Content-Type': 'text/plain'}, 200);
	//res.send();
});

module.exports = router;
