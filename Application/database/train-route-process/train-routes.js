var merge = require('merge');
var mysql = require('./mysql');
var fs = require('fs');

function getLines(cb) {
	mysql.query(
		'SELECT * from line'
//		 + " WHERE contains(GeomFromText('Polygon((51.500217 0.214378, 51.493949 1.503170, 50.671713 1.503170, 50.690852 0.002936, 51.500217 0.214378))'), line);"
		, function(err, rows, fields) {
	  if (err) throw err;

	  cb(rows.map(function (row) {
	  	return row.line;
	  }));
	});
}
function getStations(cb) {
	mysql.query(
		'SELECT * from station'
//		 + " WHERE contains(GeomFromText('Polygon((51.500217 0.214378, 51.493949 1.503170, 50.671713 1.503170, 50.690852 0.002936, 51.500217 0.214378))'), loc);"
		, function(err, rows, fields) {
	  if (err) throw err;

	  cb(rows);
	});
}

function getCrossings(cb) {
	mysql.query(
		'SELECT * from crossings'
//		 + " WHERE contains(GeomFromText('Polygon((51.500217 0.214378, 51.493949 1.503170, 50.671713 1.503170, 50.690852 0.002936, 51.500217 0.214378))'), loc);"
		, function(err, rows, fields) {
	  if (err) throw err;

	  cb(rows);
	});
}

Array.prototype.first = function () {
	return this[0];
};
Array.prototype.last = function () {
	return this[this.length - 1];
};

Array.prototype.remove = function (element) {
	var index = this.indexOf(element);
	if (index > -1) {
		this.splice(index, 1);
	}
};


function sqr(x) { return x * x; }
function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y); }
function distToSegmentSquared(p, v, w) {
  var l2 = dist2(v, w);
  if (l2 == 0) return dist2(p, v);
  var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  if (t < 0) return dist2(p, v);
  if (t > 1) return dist2(p, w);
  return dist2(p, { x: v.x + t * (w.x - v.x),
                    y: v.y + t * (w.y - v.y) });
}
function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w)); }



function pointKey(point) {
	return point.x + '-' + point.y;
}

var normalizedPointMap = {};
function normalizePoint(point, type, meta) {
	var key = pointKey(point);
	meta = meta || {};
	if (!normalizedPointMap[key]) {
		normalizedPointMap[key] = merge.recursive({}, point, meta);
	}

	if (type) {
		normalizedPointMap[key].type = type;
	}

	return normalizedPointMap[key];
}


function handleLines(lines) {
	var i;

	// Copy all lines so we have backwards to
	console.log('Cloning and reversing lines...');
	var currentLinesLength = lines.length;
	for (i = 0; i < currentLinesLength; i++) {
		lines.push(lines[i].concat([]).reverse());
	}

	// Fuck knows this isnt going in the repo
	// Map points into mysql thing
	console.log('Building points map');
	var pointsMap = new Map();

	for (i = 0; i < lines.length; i++) {
		var points = lines[i];
		for (pointI = 1; pointI < points.length; pointI++) {
			var first = normalizePoint(points[pointI - 1], 'track');
			var second = normalizePoint(points[pointI], 'track');

			if (!pointsMap.has(first)) {
				pointsMap.set(first, []);
			}

			pointsMap.get(first).push(second);
		}
	}

	return pointsMap;
}

function addStationsToPointMap(pointsMap, stations) {

	console.log('Joining stations');
	// for each station
	stations.forEach(function (station, index) {

		var stationPoint = normalizePoint(station.loc, 'station', {stationCode: station.crs});

		console.log('Adding station to map: ' + (index + 1) + '/' + stations.length);

		var bestFit = getClosestMatch(pointsMap, stationPoint);

		// Now we have the closest track, insert the point
		insertPointBetween(pointsMap, bestFit.from, bestFit.to, stationPoint);

	});
}

function addCrossingsToPointMap(pointsMap, crossings) {

	console.log('Joining crossings');
	// for each station
	crossings.forEach(function (crossing, index) {

		var crossingPoint = normalizePoint(crossing.loc, 'crossing');

		console.log('Adding crossing to map: ' + (index + 1) + '/' + crossings.length);

		var bestFit = getClosestMatch(pointsMap, crossingPoint);

		// Now we have the closest track, insert the point
		insertPointBetween(pointsMap, bestFit.from, bestFit.to, crossingPoint);

	});
}

function getClosestMatch(pointsMap, searchPoint) {

	// Place to store the best fit
	var bestDistance = Infinity;
	var bestFit = null;


	// Loop over each starting point
	pointsMap.forEach(function (value, key) {
		var fromPoint = key;

		// Loop over each destination point
		for (var i in value) {
			var toPoint = value[i];

			// Calculator the distance
			var distance = distToSegment(searchPoint, fromPoint, toPoint);

			// if its the closest yet, store it
			if (distance < bestDistance) {
				bestFit = {
					from: fromPoint,
					to: toPoint
				};
				bestDistance = distance;
			}
		}
	});

	return bestFit;
}

function insertPointBetween(pointsMap, from, to, leNew) {

		// Now we have the closest track, insert the point
		pointsMap.get(from).remove(to);
		pointsMap.get(from).push(leNew);
		pointsMap.get(to).remove(from);
		pointsMap.get(to).push(leNew);

		pointsMap.set(leNew, []);
		pointsMap.get(leNew).push(to);
		pointsMap.get(leNew).push(from);
}

function numberOfStations(pointsMap) {
	var i = 0;

	pointsMap.forEach(function (connectedTo, point) {
		if (point.type == 'station') {
			i++;
		}
	});

	return i;
}

function pullRoutes(pointsMap, callback, done, tracker) {

	var stations = numberOfStations(pointsMap);
	var i = 1;
	var i2 = 1;
	var points = [];

	function processARoute() {
		
		if (tracker.queLength > 100) {
			return setTimeout(processARoute, 10);
		}

		var point = points.pop();

		if (!point) {
			done();
			return;
		}

		console.log('Routing from station: ' + points.length + ' remaining');
		callback(pullRoutesForStation(pointsMap, point));

		setTimeout(processARoute, 10);
	}

	console.log('Routing between stations');

	pointsMap.forEach(function (connectedTo, point) {
		if (point.type != 'station') {
			return;
		}

		points.push(point);
	});

	processARoute();

	return;
}

function pullRoutesForStation(pointsMap, station) {
	var finishedRoutes = [
		[station, station]
	];
	var pointsVisited = new Map();
	pointsVisited.set(station, true);
	var routes = [
		[station]
	];
	routes[0].stationCount = 1;
	var route;

	while (routes.length) {
		route = routes.shift();

		if (route.stationCount > 6) {
			continue;
		}

		var currentPoint = route.last();
		var connectedTo = pointsMap.get(currentPoint);

		connectedTo.forEach(function (nextPoint) {
			if (pointsVisited.get(nextPoint)) {
				return;
			}
			
			pointsVisited.set(nextPoint, true);


			var newRoute = route.concat([]);
			newRoute.stationCount = route.stationCount;
			
			newRoute.push(nextPoint);
			
			if (nextPoint.type == 'station') {
				newRoute.stationCount++;
				finishedRoutes.push(newRoute);
			}

			routes.push(newRoute);
		});
	}

	return finishedRoutes;
}

function nextPoints(pointsMap, history) {
	var currentPoint = history.last();
	var connectedTo = pointsMap.get(currentPoint);
	return connectedTo.map(function (nextPoint) {
		var newPath = history.concat([]);
		newPath.push(currentPoint);
		return newPath;
	});
}


function getDatabaseData(cb) {

	getLines(function (lines) {

		getStations(function (stations) {

			getCrossings(function (crossings) {

				cb(
					lines,
					stations,
					crossings);
			});

		});

	});
}

var asyncTracker = (function (logThreshold, message) {
	var onComplete = function () {};
//	var counter = 0;
	return {
		queLength: 0,
		track: function () {
			var _this = this;
			_this.queLength++;
			return function () {
				_this.queLength--;
				if ((_this.queLength % logThreshold) == 0) {
					console.log(_this.queLength + message);
				}

				if (_this.queLength == 0) {
					onComplete();
				}
			};
		},
		onComplete: function (_onComplete) {
			onComplete = _onComplete;
			if (_this.queLengthr == 0) {
				onComplete();
			}
		}
	};
});

function routeHasCrossingIn(route) {
	return route.some(function (point) {
		return point.type == 'crossing';
	});
}

/*
function insertRoutesIntoDB(routes, tracker) {

	routes.forEach(function (route, key) {

		var lingStringInner = route.map(function (point) {
			return point.x + ' ' + point.y;
		}).join(',');

		var lineString = 'GeomFromText(\'LINESTRING(' + lingStringInner + ')\')';

		mysql.query(
			"INSERT INTO train_routes (`from`, `to`, `route`, `hasCrossing`) VALUES (?,?, " + lineString + ", ? )",
			[route.first().stationCode, route.last().stationCode, routeHasCrossingIn(route)],
			tracker.track()
		);
	});
}

*/

function insertRoutesIntoDB(routes, tracker) {
        
        var routeBlock;


        while(true) {
        	
		routeBlock = routes.splice(0, 9);

		if (routeBlock.length == 0) {
			break;
		}

                var insert = [];
                var params = [];
                routeBlock.forEach(function (route, key) {

                        var lingStringInner = route.map(function (point) {
                                return point.x + ' ' + point.y;
                        }).join(',');

                        var lineString = 'GeomFromText(\'LINESTRING(' + lingStringInner + ')\')';

                        params = params.concat([route.first().stationCode, route.last().stationCode, routeHasCrossingIn(route)]);
                        insert.push("(?,?, " + lineString + ", ? )");
                });


                mysql.query(
                        "INSERT INTO train_routes (`from`, `to`, `route`, `hasCrossing`) VALUES " + insert.join(', '),
                        params,
                        tracker.track()
                );

        }
}

function loadCachedMap() {
	var jsonStr = fs.readFileSync('map.json');
	var json = JSON.parse(jsonStr);

	var map = new Map();

	json.forEach(function (connection) {
		map.set(normalizePoint(connection.key), connection.points.map(function (point) {
			return normalizePoint(point);
		}));
	});

	return map;
}

function savePointsMap(pointsMap, fileName) {
	var tmp = [];
	pointsMap.forEach(function (value, key) {
		tmp.push({ key:key, points: value});
	});

	require('fs').writeFileSync(fileName, JSON.stringify(tmp, null, 3));
}

mysql.connect();

getDatabaseData(function (lines, stations, crossings) {

	var pointsMap;

	if (fs.existsSync('map.json')) {
		pointsMap = loadCachedMap();
	} else {
		pointsMap = handleLines(lines);

		addStationsToPointMap(pointsMap, stations);

		addCrossingsToPointMap(pointsMap, crossings);

		savePointsMap(pointsMap, 'map.json');
	}

	var tracker = asyncTracker(2, ' committing to db');
	setTimeout(tracker.track(), 1000);

	var stationToStationRoutes = pullRoutes(pointsMap, function (routes) {
		insertRoutesIntoDB(routes, tracker);
	}, function () {
		mysql.end();
	}, tracker);


});



