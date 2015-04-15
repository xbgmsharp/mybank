var express = require('express');
var router = express.Router();
var mysql  = require('mysql');
var fs = require('fs');
var csv = require('fast-csv');
var multiparty = require('multiparty')
  , http = require('http')
  , util = require('util')
var moment = require('moment');
var iconv = require('iconv-lite');
var halifaxstream = require('../libs/halifaxstream.js');

/* GET import page. */
router.get('/', function(req, res) {
	res.render('import', { });
});

/* POST import page. */
router.post('/', function(req, res) {

        // Mysql Connect
        var connection = mysql.createConnection('mysql://root:root@localhost:3306/mybank?dateStrings=true');

        connection.connect(function(err) {
          if (err) {
            console.error('error connecting: ' + err.stack);
            res.render('error', { "message" : "Error connecting to database", "error" : err});
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
		//console.log(query.sql);
	}

	var form = new multiparty.Form();
	form.parse(req, function(err, fields, files) {
		console.log(files);

		if (!files || !files.upfile || !files.upfile[0]) { res.end("END file upload"); return; }

		var stream = fs.createReadStream(files.upfile[0].path).pipe(iconv.decodeStream('latin1'));

		/* ING DIRECT CSV */
		if (files.upfile[0].originalFilename.match(/movimientos/) && files.upfile[0].originalFilename.match(/.csv/)) { // IF BANK ING
		var csvStream1 = csv
		 .fromStream(stream, {delimiter:';', quote:'"', headers: true, headers : ["FECHAOPER", "FECHAVALOR", "Op", "IMPORTE", "SALDO"]})
		 .on("record", function(data){
			if (data.FECHAOPER && data.Op && data.IMPORTE && data.FECHAVALOR && data.SALDO) {
				if (moment(data.FECHAOPER, 'DD/MM/YYYY').isValid() && moment(data.FECHAVALOR, 'DD/MM/YYYY').isValid()) {
					data.Date = moment(data.FECHAOPER, 'DD/MM/YYYY').format('YYYY-MM-DD');
					data.Montant = data.IMPORTE.replace(",", ".").replace(" ", "");
					data.Desc = "";
					data.Country = "ES";
					if (data.Op.match(/GIGANEWS/)) { data.Desc = "GIGANEWS"; }
					else if (data.Op.match(/NTT/)) { data.Desc = "Salaire"; }
					else if (data.Op.match(/COFIBAR/)) { data.Desc = "Loyes ES"; }
			 		console.log(data);
					dbinsert(data);
				}
			}
		 })
		 .on('error', function(error) {
			console.log('Error ING DIRECT '+ error);
		 })
		 .on("end", function(){
			console.log("done ING DIRECT");
			//res.write("received INGDIRECT records");
		 });
		}

		/* ING DIRECT XLS */
		if (files.upfile[0].originalFilename.match(/^movimientos/) && files.upfile[0].originalFilename.match(/.xls/)) { // IF BANK ING EXECL Format
			var XLSX = require('xlsx');
			var workbook = XLSX.readFile(files.upfile[0].path);
			var resultcsv = [];
			workbook.SheetNames.forEach(function(sheetName) {
				var csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
				if(csv.length > 0){
					resultcsv.push("SHEET: " + sheetName);
					resultcsv.push("");
					resultcsv.push(csv);
				}
				resultcsv.join("\n");
			});
			console.log(resultcsv);
			var csvStream = csv
			 .fromString(resultcsv[2], {delimiter:',', quote:'"', headers: true, headers : ["FECHAOPER", "FECHAVALOR", "Op", "IMPORTE", "SALDO"]})
			 .on("record", function(data){
				if (data.FECHAOPER && data.Op && data.IMPORTE && data.FECHAVALOR && data.SALDO) {
					if (moment(data.FECHAOPER, 'DD/MM/YYYY').isValid() && moment(data.FECHAVALOR, 'DD/MM/YYYY').isValid()) {
						data.Date = moment(data.FECHAOPER, 'DD/MM/YYYY').format('YYYY-MM-DD');
						data.Montant = data.IMPORTE.replace(",", "").replace(" ", "");
						data.Desc = "";
						data.Country = "ES";
						if (data.Op.match(/GIGANEWS/)) { data.Desc = "GIGANEWS"; }
						else if (data.Op.match(/NTT/)) { data.Desc = "Salaire"; }
						else if (data.Op.match(/COFIBAR/)) { data.Desc = "Loyes ES"; }
						console.log(data);
						dbinsert(data);
					}
				}
			 })
			 .on('error', function(error) {
				console.log('Error ING DIRECT XLS '+ error);
			 })
			 .on("end", function(){
				console.log("done ING DIRECT");
				//res.write("received INGDIRECT XLS records");
			 });
		}

		/* SABADELL */
		var halifax_regex = /^\d*_\d*_\d*\.csv$/;
		if (!halifax_regex.test(files.upfile[0].originalFilename) && files.upfile[0].originalFilename.match(/.csv/)) { // IF BANK SABADELL
		var csvStream2 = csv
//		 .fromStream(stream, {delimiter:';', quote:'"', headers : ["FECHAOPER", "Op", "FECHAVALOR", "IMPORTE", "SALDO", "REFERENCIA 1", "REFERENCIA 2"]})
		 .fromStream(stream, {delimiter:'|', quote:'"', headers : ["FECHAOPER", "Op", "FECHAVALOR", "IMPORTE", "SALDO", "REFERENCIA 1", "REFERENCIA 2"]})
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
			console.log('Error SABADELL '+ error);
		 })
		 .on("end", function(){
			console.log("done SABADELL");
			//res.write("received SABADELL records");
		 });
		}

		/* BNP */
		if (files.upfile[0].originalFilename.match(/.exl/)) { // IF BANK BNP
		var csvStream3 = csv
		 .fromStream(stream, {delimiter:'\t', quote:'"', headers : ["Date", "Op", "Montant"]})
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
				console.log(data);
				dbinsert(data);
			}
		 })
		 .on('error', function(error) {
			console.log('Error BNP '+ error);
		 })
		 .on("end", function(){
			console.log("done BNP");
			//res.write("received BNP records");
		 });
		}

		/* HALIFAX */
		if (files.upfile[0].originalFilename.match(/.csv/) && halifax_regex.test(files.upfile[0].originalFilename)) { // IF BANK HALIFAX
                var halifax = new halifaxstream();
		var stream = fs.createReadStream(files.upfile[0].path).pipe(halifax);
		var csvStream4 = csv
		 .fromStream(stream, { delimiter:',', headers: true, headers : ["TransactionDate","TransactionType","SortCode","AccountNumber","TransactionDescription","DebitAmount","CreditAmount","Balance"]})
		 .on("record", function(data){
			if (data.TransactionDate && data.TransactionType && data.TransactionDescription && ( data.DebitAmount || data.CreditAmount )) {
				if (moment(data.TransactionDate, 'DD/MM/YYYY').isValid() ) {
					data.Date = moment(data.TransactionDate, 'DD/MM/YYYY').format('YYYY-MM-DD');
					if (data.DebitAmount) {
						data.Montant = "-" + data.DebitAmount.replace(",", ".");
					} else if (data.CreditAmount)
						data.Montant = data.CreditAmount.replace(",", ".");
					data.Op = data.TransactionType +" "+ data.TransactionDescription;
					data.Desc = "";
					data.Country = "UK";
					if (data.Op.match(/TESCO/)) { data.Desc = "Course"; }
					else if (data.Op.match(/SAINSBURY/)) { data.Desc = "Course"; }
					else if (data.Op.match(/COSTCUTTER/)) { data.Desc = "Course"; }
					else if (data.Op.match(/VERIZON/)) { data.Desc = "Salaire"; }
					else if (data.Op.match(/Transferwise/)) { data.Desc = "Economie UK"; }
					else if (data.Op.match(/^TFR FORGN /)) { data.Desc = "Economie UK"; }
					else if (data.Op.match(/SALISBURY/)) { data.Desc = "Pub"; }
					else if (data.Op.match(/DICKENS INN/)) { data.Desc = "Pub"; }
					else if (data.Op.match(/TWO BREWERS/)) { data.Desc = "Pub"; }
					else if (data.Op.match(/THE FALTERING FULL/)) { data.Desc = "Pub"; }
					else if (data.Op.match(/ALL BAR ONE/)) { data.Desc = "Pub"; }
					console.log(data);
					dbinsert(data);
				}
			}
		 })
		 .on('error', function(error) {
			console.log('Error HALIFAX '+ error);
		 })
		 .on("end", function(){
			console.log("done HALIFAX");
			//res.write("received HALIFAX records");
		 });
		}

		/* Credit Agricole */
		var CreditAgricole_regex = /^CA\d*_\d*\.CSV$/;
		if (files.upfile[0].originalFilename.match(/.CSV/) && CreditAgricole_regex.test(files.upfile[0].originalFilename)) { // IF BANK CreditAgricole
		var csvStream4 = csv
                 .fromStream(stream, { quote: '"', escape: '"', ignoreEmpty: true, headers: true, strictColumnHandling: false, delimiter:';', headers : ["Date","Libelle","DebitEuros","CreditEuros"]})
		 .on("record", function(data){
			if (data.Date && data.Libelle && ( data.DebitEuros || data.CreditEuros )) {
				if (moment(data.Date, 'DD/MM/YYYY').isValid() ) {
					data.Date = moment(data.Date, 'DD/MM/YYYY').format('YYYY-MM-DD');
					if (data.DebitEuros) {
						data.Montant = "-" + data.DebitEuros.replace(",", ".");
					} else if (data.CreditEuros)
						data.Montant = data.CreditEuros.replace(",", ".");
					data.Op = data.Libelle.replace(/[\n\t\r]/g, "");
					data.Desc = "";
					data.Country = "FR";
					if (data.Op.match(/Assurance Pret/)) { data.Desc = "Pret"; }
					console.log(data);
					dbinsert(data);
				}
			}
		 })
		 .on('error', function(error) {
			console.log('Error CreditAgricole '+ error);
		 })
		 .on("end", function(){
			console.log("done CreditAgricole");
			//res.write("received HALIFAX records");
		 });
		}


		/* Remove the upload file */
		fs.unlink(files.upfile[0].path, function(err) {
		        if(err) console.error(err.stack);
		});

//		res.writeHead(201, {'content-type': 'text/plain'});
//		res.write('received upload:\n\n');
//		res.end(util.inspect({fields: fields, files: files}));

		console.log('Upload completed!');
	});

//	res.send("import", {'Content-Type': 'text/plain'}, 200);
//	res.end();
});

module.exports = router;
