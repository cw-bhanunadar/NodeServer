const express = require('express');
const mongodb = require('mongodb');
const bodyParser = require("body-parser");
const nodeMailer = require("nodemailer");
var jwt = require('jsonwebtoken');
var verifyToken=require("./verifyToken");
var app = express();
app.use(bodyParser.json());
ObjectId = require('mongodb').ObjectID;
app.use(express.static('resources'))
var bcrypt = require('bcrypt-nodejs');
const saltRounds = 10;
var secret = "wearegoingtowinSIH";
var cors = require("cors");
app.use(cors());
var server_url=" http://139.59.58.64:8080";
var autoIncrement = require("mongodb-autoincrement");
app.use(bodyParser.urlencoded({ extended: true }));
var url = "mongodb://mongo:27017/";
app.use(express.static("resources"));

var mongoClient = mongodb.MongoClient;
app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

app.get("/", function (req, res) {
	res.send("hello1245");
	console.log("requested");
});
/**********************************sign up******************/
app.post("/signup", function (req, res) {

	mongoClient.connect(url, function (err, db) {
		if (err) {
			console.log("db not connected");
			var failure = {
				status: "failure",
				message: err,
			}
			res.send(failure);
		}
		else {
			var dbo = db.db("mydb");

			var query = { email: req.body.email };
			dbo.collection("users").findOne(query, function (err, resu) {
				if (err) {
					console.log(err);
					var failure = {
						status: "failure",
						message: err,
					}
					console.log("Email alredy registered");
					res.send(failure);
				}
				if (resu == null) {
					console.log("Adding");
					//console.log(req);
					var hashP, user;
					bcrypt.hash(req.body.password, null, null, function (err, hash) {
						// Store hash in your password DB.
						if (err)
							console.log(err);
						hashP = hash;
						console.log(hash);
						user = {
							name: req.body.name,
							email: req.body.email,
							phonenumber: req.body.phonenumber,
							address: req.body.address,
							password: hashP,
						}
						console.log(user);
						dbo.collection("users").insertOne(user, function (err, result) {
							if (err) {
								console.log(err);
								var failure = {
									status: "failure",
									message: err,
								}
								res.send(failure);
							}
							else {
								console.log("user added");
								var success = {
									status: "success",
									messgae: "New User Added",
								}

								res.send(success);
							}
						});
					});

				}
				else {
					var failure = {
						status: "failure",
						message: "Email Already Used",
					}
					res.send(failure);
				}
			});

		}

	});

});

/**************Authentication***************/
app.post("/auth", function (req, res) {

	
	mongoClient.connect(url, function (err, db) {
		if (err) {
			console.log("Unable to connect", err);
			console.log("failure");
			var failure = {
				status: "failure",
				message: err,
			}
			res.send(failure);
		}
		else {
		
			
			console.log("Connection established");
			var dbo = db.db("mydb");

			var query = { email: req.body.email };
			dbo.collection("users").findOne(query, function (err, resu) {
				if (err) {
					var failure = {
						status: "failure",
						message: err,
					}
					console.log("failure");
					res.send(failure);
				}
				else {
					if (resu == null) {
						var failure = {
							status: "failure",
							message: "No User Found",
						}
						console.log("failure user not found");
						res.send(failure);
					}
					else {
						var hash = resu.password;
						var ans = bcrypt.compareSync(req.body.password, hash);
						if (ans) {
							var success = {
								status: "success",
								message: "Succesfully Loged In"
							}
							console.log("succes");
							var token = jwt.sign({ id: req.body.email }, secret, {
								expiresIn: 86400 // expires in 24 hours
							  });

						  
							  res.status(200).send({ status:"success", user:resu, auth: true, token: token });
							
						}
						else {
							var failure = {
								status: "failure",
								message: "Password is Incorrect",
							}
							console.log("failure");
							res.send(failure)
						}
					}
				}
			});
		}
		db.close();
	});
});
/*******************wish list ******************/
app.post("/addToWishList",verifyToken, function (req, res,next) {
	console.log(req);
	
	mongoClient.connect(url, function (err, db) {
		if (err) {
			console.log(err);
			var failure = {
				status: "failure",
				message: err,
			}
			res.send(failure);
		}
		else {
			var dbo = db.db("mydb");
			var user_email = req.body.email;

			var collection = dbo.collection("users");
			if (req.body.toAdd == true) {
				// collection.find({email:req.body.email}).toArray().then(function(err, result) {console.log(err);
				collection.update({ email: user_email }, { $push: { "watchList": { "itemcode": req.body.itemcode } } }, function (err, req) {
					if (err) {
						console.log(err);
						var failure = {
							status: "failure",
							message: err,
						}
						res.send(failure);
					}
					else {
						var success = {
							status: "success",
							message: "Succesfully Added to Database"
						}
						res.send(success);
					}
				});
			}
			else {
				collection.update({ email: user_email }, { $pull: { "watchList": { "itemcode": req.body.itemcode } } }, function (err, req) {
					if (err) {
						console.log(err);
						var failure = {
							status: "failure",
							message: err,
						}
						res.send(failure);
					}
					else {
						var success = {
							status: "success",
							message: "Succesfully Removed from Database"
						}
						res.send(success);
					}
				});
			}
		}
		db.close();
	});
});


/************ To Add Comment************* */
app.post("/addComment",/*verifyToken,*/ function (req, res,next) {
	mongoClient.connect(url, function (err, db) {
		if (err) {
			var failure = {
				status: "failure",
				message: err,
			}
			res.send(failure);
		}
		else {
			var Comment = {
				title: req.body.title,
				rating: req.body.rating,
				description: req.body.description,
				user: req.body.email,
			}
			var dbo = db.db("mydb");
			var collection = dbo.collection("price_table");
			collection.update({ itemcode: req.body.itemcode }, { $push: { "comments":  Comment  } }, function (err, req) {
				if (err) {
					var failure = {
						status: "failure",
						message: err,
					}
					res.send(failure);
				}
				else {
					var success = {
						status: "success",
						message: "Succesfully Added to Database",
					}
					res.send(success);
				}
			});
		}
	});
});
/***********************to Show The Full Detail of one item********** */
app.post("/showDetails",verifyToken, function (req, res,next) {
	console.log(req.itemcode);
	  mongoClient.connect(url, function (err, db) {
		if (err) {
			var failure = {
				status: "failure",
				message: err,
			}
			res.send(failure);
		}
		else {
			var id = req.body.itemcode;
			console.log(id);
			var dbo = db.db("mydb");
			dbo.collection("price_table").findOne({ itemcode:req.body.itemcode }, function (err, resu) {
				if (err) {
					var failure = {
						status: "failure",
						message: err,
					}
					res.send(failure);
				}
				else {
					//console.log(resu);
					if(resu!=null){
					var url=server_url+"/"+resu.icon;
					var url_sm=server_url+"/"+resu.icon_small;
					console.log(url+" "+url_sm);
					resu.icon=url;
					resu.icon_small=url_sm;
					console.log(resu);
					res.send(resu);
					}
				}
			});

		}
	});
});
// /***********To group channel vise like jio****************** */
app.get("/getChannels",verifyToken, function (req, res,next) {
	mongoClient.connect(url, function (err, db) {
		if (err) {
			var failure = {
				status: "failure",
				message: err,
			}
			res.send(failure);
		}
		else {
			var dbo = db.db("mydb");
			var collection = dbo.collection("price_table");
			collection.aggregate([{ "$group": { _id: { channel_name: "$channel_name" }, price_table: { $push: "$$ROOT" } } }])
				.toArray(function (err, result) {
					if (err) {
						// console.log(err);
						console.log("err");
						var failure = {
							status: "failure",
							message: err,
						}
						res.send(failure);
					}

					else {
						res.send(result);

					}
				});
		}
		db.close();
	});
});
/********Top 10 recomendation*/
// app.get("/recomendation",function(req,res){
// 	mongoClient.connect(url,function(err,db){
// 		if (err) {
// 			var failure = {
// 				status: "failure",
// 				message: err,
// 			}
// 			res.send(failure);
// 		}
// 		else {
// 			var dbo=db.db("mydb");
// 			var collection=dbo.collection("price_table");
// 			collection.aggregate([{ "$group":{_id:"$genre"},count:{ $sum: 1 },$sort:{count:-1}},price_table: { $"$$ROOT" }}]).toArray(function(err,resu){
// 				if(err){
// 				var failure = {
// 					status: "failure",
// 					message: err,
// 				}
// 				res.send(failure);
// 			}
// 			else{
// 				res.send(resu);
// 			}
// 			});

// 		}
// 	});
// })
/*****************Billing History Of User***************** */
app.post("/billing_record", function (req, res) {
	mongoClient.connect(url, function (err, db) {
		if (err) {
			var failure = {
				status: "failure",
				message: err,
			}
			res.send(failure);
		}
		else {
			console.log("Connection established");
			var dbo = db.db("mydb");
			autoIncrement.getNextSequence(dbo, "billing_record", function (err, autoIndex) {
				if (err) {
					var failure = {
						status: "failure",
						message: "Failed to Add",
					}
					res.send(failure);
				}
				else {
					var collection = dbo.collection("billing_record");
					collection.insert({
						payid: autoIndex,
						amount: req.body.amount,
						paydate: new Date(),
						user_email: req.body.email,
						itemcode: req.body.itemcode,
					}, function (err, rese) {
						if (err) {
							var failure = {
								status: "failure",
								message: "Failed to Add",
							}
							res.send(failure);
						}
						else {
							console.log("Added");
							var success = {
								status: "sucess",
								message: "Succesfully Added to Database"
							}
							res.send(success);
						}
					});
				}
			});

		}
		db.close();
	});
});
app.get("/getItems",function(req,res){
	mongoClient.connect(url, function (err, db) {
		if (err) {
			console.log(err);
			var failure = {
				status: "failure",
				message: err,
			}
			res.send(failure);
		}
		else {
				var dbo=db.db("mydb");
				dbo.collection("price_table").find({}).toArray(function(err,resu){
						if(err)
						{
							console.log(err);
							var failure = {
								status: "failure",
								message: err,
							}
							res.send(failure);
							return;
						}
						else{
							if(resu!=null)
							{
								// var url=server_url+"/"+resu.icon;
								// var url_sm=server_url+"/"+resu.icon_small;
								// console.log(url+" "+url_sm);
								// resu.icon=url;
								// resu.icon_small=url_sm;
								// console.log(resu);
								

								for(var i = 0; i < resu.length; i++)	{
									resu[i].icon = server_url+"/"+resu[i].icon
									resu[i].icon_small = server_url+"/"+resu[i].icon_small
								}
								res.send(resu);
								
								return;
							}
						}
				});
		}
	});
});
/******************All Item Details********************** */
app.post("/admin/price_table", function (req, res) {
	mongoClient.connect(url, function (err, db) {
		if (err) {
			console.log(err);
			var failure = {
				status: "failure",
				message: err,
			}
			res.send(failure);
		}
		else {
			var dbo = db.db("mydb");
			var object = {
				itemcode: req.body.itemcode,
				title: req.body.title,
				cost: req.body.cost,
				timing_start: req.body.start,
				timing_end: req.body.end,
				channel_id: req.body.id,
				channel_name: req.body.channel_name,
				rating: req.body.rating,
				releaseYear: req.body.releaseYear,
				duration: req.body.duration,
				genre: req.body.genre,
				icon: req.body.icon,
				icon_small: req.body.icon_small,
				description: req.body.description,
				trailerUrl: req.body.trailerUrl,
			}
			
			dbo.collection("price_table").findOne({itemcode:req.body.itemcode},function(err,result){
				if(err)
				{
					var failure = {
						status: "failure",
						message: err,
					}
					res.send(failure);
				}
				else
				{
					console.log(result);
					if(result!=null)
					{
						var mess={
							message:"itemcode already used",
						}
						res.send(mess);
						return;
					}
					
					console.log("hello");
				}
			});
			console.log("created object at price_table");
			dbo.collection("price_table").insertOne(object, function (err, resu) {
				if (err) {
					var failure = {
						status: "failure",
						message: err,
					}
					res.send(failure);
				}
				else {
					var success = {
						status: "success",
						message: "Succesfully Added to Database"
					}
					res.send(success);
				}
			});
		}
		db.close();
	});
});
/***********Logout******** */
app.get("/logout", function (req, res) {
	
});
app.listen(3000, function () {
	console.log("Server started");
});
module.exports=app;