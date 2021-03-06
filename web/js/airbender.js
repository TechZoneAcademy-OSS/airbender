
function setupAirbenderMap(lmap,url,urltype="google"){
	setupMojoMap(lmap,url,urltype="google");
	var url="https://spreadsheets.google.com/feeds/list/1mBWTyAp3tCnuunrK1Rbptb4rGDwByqX4NyUe8kxmR5Q/od6/public/basic?alt=json"
}

function addAirbenderDevLayer(map,defaultmarker,data,tabletop){
	console.log(data)
	devices=getPointsAsGeoJson(data)
	markerlayer=L.geoJson(devices, {
		onEachFeature : function(device,layer){
			jsonurl=device['properties']['feedurl']
			icon=getDevIcon(device['properties']['aqi'])
			layer.setIcon(icon)
			layer.bindPopup("Loading...",{maxWidth: 800})
			layer.on('click', function(e){
				jsonurl=device['properties']['feedurl']
				console.log(jsonurl)
				$.getJSON(jsonurl,function(data){
					channeldata=getDataAsArray(data)
					console.log(channeldata)
					addAirbenderPopup(e,channeldata,device)
				});	
			});
			
		}
	}).addTo(map);	
}

function addAirbenderPopup(e,channeldata,device){
	var popup = e.target.getPopup();
	channeldata2=channeldata
	latestavgs=getLatestAvgs(device['properties']['devname'],channeldata2)
	var div = $('<div id="'+device['properties']['devname']+'" class="popupGraph" style="width: 600px; height:250px;">\
					<b>'+device['properties']['devname']+'</b>\
					<br>Readings averaged over last 10 mins\
					<br><b>Updated: </b>'+Date(latestavgs['ts']['date']*1000)+'\
					<br><a href="'+device['properties']['url']+'" target="_blank">Datafeed</a>\
					<table width=100%><tbody>\
					<tr><td><td><b>Avg PM10: </b></td><td style="text-align: left"	>'+latestavgs['avgpm10']+'</td></td><td><td><b> Avg PM25: </b></td><td style="text-align: left">'+latestavgs['avgpm25']+'</td></td><td><td><b>Avg AQI: </b></td><td style="text-align: left">'+latestavgs['avgaqi']+'</td></td></tr>\
					<tr><td><td><b>Avg SI PM10: </b></td><td style="text-align: left">'+latestavgs['avgsipm10']+'</td></td><td><td><b> Avg SI PM25: </b></td><td style="text-align: left">'+latestavgs['avgsipm25']+'</td></td><td><td></td></td></tr>\
					</tbody></table><br>\
					<table width=100%><tbody>\
					<tr><td><div id="pm10"></div></td><td><div id="pm25"></div></td><td><div id="aqi"></div></td></tr>\
					</tbody></table><br>\
					</div>')[0];
	
	
	popup.setContent(div);
	popup.update();
	graphdata=channeldata
	displayGraph(div,graphdata);
	popup.setContent(div);
	popup.update();
}


function getDevIcon(aqi){
	//console.log("AQI reported for icon selection="+aqi)
	chosen_icon="icons/aqibase.png"
	if (aqi<=50){
		chosen_icon="icons/aqi0good.png"
	}
	else if(aqi>50 && aqi <=100){
		chosen_icon="icons/aqi1satisfactory.png"
	}
	else if(aqi>100 && aqi <=200){
		chosen_icon="icons/aqi2moderate.png"
	}
	else if(aqi>200 && aqi <=300){
		chosen_icon="icons/aqi3poor.png"
	}
	else if(aqi>300 && aqi <=400){
		chosen_icon="icons/aqi4vpoor.png"
	}
	else if(aqi>400){
		chosen_icon="icons/aqi5severe.png"
	}
	var devicon=L.icon({
				iconUrl: chosen_icon,
				iconSize: [30,30]
			})
	devicon=L.divIcon({
		className : "icon-div",
		html: '<br>'+aqi+'<img src="'+chosen_icon+'" style="height: 30;width: 30;"/>'
	})
	//console.log(devicon.options.iconUrl)
	return devicon		
}	
	
		


function getDataAsArray(channeldata){
	cdataarray=[]
	for (var key in channeldata){
		if (channeldata.hasOwnProperty(key)){
			cdataarray.push(channeldata[key])
		}
	}
	return cdataarray
}

// load device list in GeoJSON from a Google spreadsheet

function getDevList(entry){
	devices=[]
	$(entry).each(function(){
		template={
			"geometry" : {
				"type":"Point","coordinates":[]
				},
			"type" : "Feature",
			"properties" : {}
		}
		template['properties']['id']=this.title.$t
		valuepairs=this.content.$t.split(",")
		$(valuepairs).each(function(){
			key=$.trim(this.split(": ")[0]);
			value=$.trim(this.split(": ")[1]);
			template['properties'][key]=value;
		});
		template['geometry']['coordinates']=[template['properties']['longitude'],template['properties']['latitude']]
		devices.push(template)		
	});
	return devices
}




function getSiPm25(pm25){
	//console.log("PM25: "+pm25)
	if(pm25<=30){
		return pm25*50/30
	}
	else if(pm25>30 && pm25<=60){
		return 50+(pm25-30)*50/30;
	}
	else if(pm25>60 && pm25<=90){
		return 100+(pm25-60)*100/30;
	}				
	else if(pm25>90 && pm25<=120){
		return 200+(pm25-90)*(100/30);
	}
	else if(pm25>120 && pm25<=250){
		return 300+(pm25-120)*(100/130);
	}
	else if(pm25>250){
		return 400+(pm25-250)*(100/130);
	}

}
function getSiPm10(pm10){
	//console.log("PM10: "+pm10)
	if(pm10<=50){
		return pm10
	}
	else if(pm10>50 && pm10<=100){
		return pm10
	}
	else if(pm10>100 && pm10<=250){
		return 100+(pm10-100)*100/150;
	}
	else if(pm10>250 && pm10<=350){
		return 200+(pm10-250);
	}
	else if(pm10>350 && pm10<=430){
		return 300+(pm10-350)*(100/80);
	}
	else if(pm10>430){
		return 400+(pm10-430)*(100/80);
	}
}
		


//Functions to calculate aqi
		
		
function getLatestAvgs(id,channeldata){
		console.log(channeldata.length)
		sumsipm25=0.0
		sumsipm10=0.0
		sumaqi=0.0
		sumpm10=0
		sumpm25=0
		for (row in channeldata){
			
			pm25=parseFloat(channeldata[row].pm25)
			pm10=parseFloat(channeldata[row].pm10)
			sumpm10=sumpm10+pm10
			sumpm25=sumpm25+pm25
			sipm25=getSiPm25(pm25)
			if (sipm25==NaN){
				console.log(channeldata)
			}
			sipm10=getSiPm10(pm10)
			sumsipm10=sumsipm10+sipm10
			sumsipm25=sumsipm25+sipm25
			if(sipm10>sipm25){
				aqi=sipm10;
			}
			else{
				aqi=sipm25;
			}
			sumaqi=sumaqi+aqi
			ts=channeldata[row].created_at
		}
		avgsipm25=sumsipm25/channeldata.length
		avgsipm10=sumsipm10/channeldata.length
		avgaqi=sumaqi/channeldata.length
		avgpm10=sumpm10/channeldata.length
		avgpm25=sumpm25/channeldata.length
		response={}
		response['avgaqi']=Math.round(avgaqi)
		response['avgsipm25']=Math.round(avgsipm25)
		response['avgsipm10']=Math.round(avgsipm10)
		response['avgpm10']=Math.round(avgpm10)
		response['avgpm25']=Math.round(avgpm25)
		console.log(ts)
		ts=new Date(ts*1000)
		
		if (isDate(ts)){
			response['ts']={"date":ts.getDate(),"time":ts.getTime()}
		}
		else if (ts.indexOf("T")!=-1){
			response['ts']={"date":ts.split("T")[0],"time":ts.split("T")[1].split("Z")[0]}
		}
		else if (ts==null){
			response['ts']=null
		}
		else{
			response['ts']={"date":ts.split(' ')[0],"time":ts.split(' ')[1]}
		}
		//console.log(response)
		return response
		
}

function isDate (value) {
	return value instanceof Date;
};

function displayGraph(div,data=null){
	parseTime=d3.timeParse("%s")
	gheight=130
	pm10={height: gheight, width:$("#pm10").width()}
	aqi={height: gheight, width:$("#aqi").width()}
	pm25={height: gheight, width:$("#pm25").width()}
	
	var svgpm25 = d3.select(div).select('#pm25').append("svg")
								.attr("width",pm25.width)
								.attr("height",pm25.height)
								.attr("id", "svgpm25")
		
	var svgpm10 = d3.select(div).select('#pm10').append("svg")
								.attr("width",pm10.width)
								.attr("height",pm10.height)
								.attr("id", "svgpm10")
	
	var svgaqi = d3.select(div).select('#aqi').append("svg")
								.attr("width",aqi.width)
								.attr("height",aqi.height)
								.attr("id", "svgaqi")
		
	var x = d3.scaleTime().range([0, pm10.width-40]);  
	var y = d3.scaleLinear().range([gheight-25, 0]);

	height=gheight-25
	
	data.forEach(function(d) {
		d.created_at = parseTime(d.created_at);
		d.pm10 = +d.pm10;
		d.pm25 = +d.pm25;
		d.sipm10=Math.round(getSiPm10(d.pm10));
		d.sipm25=Math.round(getSiPm25(d.pm25));
		if(d.sipm10>d.sipm25){
			d.aqi=d.sipm10;
		}
		else{
			d.aqi=d.sipm25;
		}
		d.aqi = +d.aqi;
		
    });
    x.domain(d3.extent(data, function(d) { return d.created_at; }));
    y.domain([0, d3.max(data, function(d) { return d.aqi; })]);
	
	svgpm10=d3.select(div).select("#svgpm10").append("g")
	
	pm10line=d3.line()
    .x(function(d) { return x(d.created_at); })
    .y(function(d) { return y(d.pm10); });

	pm25line=d3.line()
    .x(function(d) { return x(d.created_at); })
    .y(function(d) { return y(d.pm25); });

	aqiline=d3.line()
    .x(function(d) { return x(d.created_at); })
    .y(function(d) { return y(d.aqi); });

	
	d3.select(div).select("#svgpm10")			
		.append("g")
		.attr("transform","translate(30,0)")
		.append("path")
		.datum(data)
			.attr("fill", "none")
			.attr("stroke", "steelblue")
			.attr("stroke-linejoin", "round")
			.attr("stroke-linecap", "round")
			.attr("stroke-width", 1.5)
			.attr("d", pm10line);
		
		
	d3.select(div).select("#svgpm25")			
		.append("g")
		.attr("transform","translate(30,0)")
		.append("path")
		.datum(data)
			.attr("fill", "none")
			.attr("stroke", "orange")
			.attr("stroke-linejoin", "round")
			.attr("stroke-linecap", "round")
			.attr("stroke-width", 1.5)
			.attr("d", pm25line);
	
	
	d3.select(div).select("#svgaqi")			
		.append("g")
		.attr("transform","translate(30,0)")
		.append("path")
		.datum(data)
			.attr("fill", "none")
			.attr("stroke", "red")
			.attr("stroke-linejoin", "round")
			.attr("stroke-linecap", "round")
			.attr("stroke-width", 1.5)
			.attr("d", aqiline);
	
	
	
	d3.select(div).select("#svgpm10")			
		.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(30," + height + ")")
		.call(d3.axisBottom(x)
              .tickFormat(d3.timeFormat("%H:%M"))
              .ticks(4))
      .selectAll("text")	
        .style("text-anchor", "end")
        .attr("dx", "-.08em")
        .attr("dy", ".075em")
        .attr("transform", "rotate(-35)");
    
    
    d3.select(div).select("#svgpm10")			
		.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(30,0)")
		.call(d3.axisLeft(y)
				.ticks(4))
	  .selectAll("text")	
        .style("text-anchor", "end")
        .attr("dx", "-.08em")
        .attr("dy", ".075em")
        .attr("transform", "rotate(-45)");

	d3.select(div).select("#svgpm25")			
		.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(30," + height + ")")
		.call(d3.axisBottom(x)
              .tickFormat(d3.timeFormat("%H:%M")))
      .selectAll("text")	
        .style("text-anchor", "end")
        .attr("dx", "-.08em")
        .attr("dy", ".075em")
        .attr("transform", "rotate(-35)");

	 d3.select(div).select("#svgpm25")			
		.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(30,0)")
		.call(d3.axisLeft(y)
				.ticks(4))
	  .selectAll("text")	
        .style("text-anchor", "end")
        .attr("dx", "-.08em")
        .attr("dy", ".075em")
        .attr("transform", "rotate(-45)");
		
	d3.select(div).select("#svgaqi")			
		.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(30," + height + ")")
		.call(d3.axisBottom(x)
              .tickFormat(d3.timeFormat("%H:%M")))
      .selectAll("text")	
        .style("text-anchor", "end")
        .attr("dx", "-.08em")
        .attr("dy", ".075em")
        .attr("transform", "rotate(-35)");
        
    d3.select(div).select("#svgaqi")			
		.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(30,0)")
		.call(d3.axisLeft(y)
				.ticks(4))
	  .selectAll("text")	
        .style("text-anchor", "end")
        .attr("dx", "-.08em")
        .attr("dy", ".075em")
        .attr("transform", "rotate(-45)");

}
