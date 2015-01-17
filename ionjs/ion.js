
var mysql = require('mysql');

Ion = {};

Ion.calculate = function (dataObj, callback) {
	var datetime = Date.parse(dataObj.datetime);
	var f_temp = ( parseInt(dataObj.temp)+13-3/4);
	var f_humidity = parseInt(dataObj.humidity) / 50;
	var f_accx = dataObj.accx;
	var f_accy = dataObj.accy;
	var f_accz = dataObj.accz;
	var f_acc = ((f_accx * f_accx) + (f_accy * f_accy) + (f_accz * f_accz)) / 3 * 1000;
	var noridobase = f_temp * f_humidity * f_acc;
	var datas = new Array();
	for (i=0;i<60;i++){
		var norido = Math.random() * noridobase;
		if (norido > 1.0) {
			norido = 1.0;
		}else if (norido < 0.0) {
			norido = 0-norido;
		}

		datetime -= 1000;

		var date = new Date();
		date.setTime(datetime);

		datas[i] = {
					"datetime":date,
					"temp":f_temp,
					"humidity":f_humidity,
					"accx":f_accx,
					"accy":f_accy,
					"accz":f_accz,
					"norido": norido// debug
					};
	}
	callback(datas);
}

Ion.initializeConnection = function() {
	Ion.connection = mysql.createConnection({
	  host	 : '***', 
	  user	 : '***', 
	  password : '***', 
	  database : '***'
	});
	Ion.connection.connect();
};

Ion.disconnect = function () {
	Ion.connection.end(function(err) {
		console.log("Disconnect.");
	});
};

Ion.readFile = function (bucket, key, callback) {
	s3.getObject({Bucket:bucket, Key:key}, function(err,data) {
		if (err) {
			console.log('error getting object ' + key + ' from bucket ' + bucket + ' ::: '+err);
		}
		else {
         var row = String(data.Body).trim();
          var data = row.split(',');
            var dataObj = {
                datetime: data[0],
                temp:  data[1],
                humidity: data[2],
                accx: data[3],
                accy: data[4],
                accz:data[5]
            };
			console.log('Got content: ', dataObj);
			callback(dataObj);
		}
	});
};

Ion.insertData = function(data) {
	console.log("Inserting: "+data.norido+" / "+data.datetime);
	Ion.connection.query("INSERT INTO `iontbl_1` SET datetime=?,temp=?,humidity=?,accx=?,accy=?,accz=?,norido=?",
		[ data.datetime, data.temp, data.humidity, data.accx, data.accy, data.accz, data.norido],
		function(err, info){
			console.log("insert: "+info+" /err: "+err);
		}
	);
};

exports.handler = function(event,context){
	console.log('Received event:');
	console.log(JSON.stringify(event, null, '  '));

	// Get the object from the event and show its content type
	var bucket = event.Records[0].s3.bucket.name;
	var key = event.Records[0].s3.object.key;

	// read file from S3
	Ion.readFile(bucket, key, function(dataObj){
		console.log(dataObj);
		// calculation&multiply data
		Ion.calculate(dataObj, function(datas) {
			for (i=0; i<datas.length; i++) {
				var obj = datas[i];
				console.log(i+": "+obj);

				// insert data to RDS
				Ion.insertData({
					datetime: obj.datetime ,
					temp: obj.temp ,
					humidity: obj.humidity ,
					accx: obj.accx ,
					accy: obj.accy ,
					accz: obj.accz ,
					norido: obj.norido
				});
			}
			context.done();
		});
	});
};

// for local node
//---
Ion.localRun = function(){
	Ion.initializeConnection();
	Ion.readFile('', '', function(dataObj){
		Ion.calculate(dataObj, function(datas) {
			for (i=0; i<datas.length; i++) {
				var obj = datas[i];
				console.log(i+": "+obj.datetime);
				Ion.insertData({
					datetime: obj.datetime ,
					temp: obj.temp ,
					humidity: obj.humidity ,
					accx: obj.accx ,
					accy: obj.accy ,
					accz: obj.accz ,
					norido: obj.norido
				});
			}
		});
	});
};

var DUMMY_NORIDO = process.argv[2];
Ion.localRun();
//---



