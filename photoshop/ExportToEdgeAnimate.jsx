﻿// (c) Copyright 2013 Adobe Systems, Inc. All rights reserved.
// author David Deraedt

#target photoshop

#include "../common/Utils.jsx"

#include "PhotoshopCommons.jsx"



(function (){
	
	if ( app.documents.length == 0 ) return;

	// Switch to pixel units
	var strtRulerUnits = app.preferences.rulerUnits;
	if (strtRulerUnits != Units.PIXELS) {
	  app.preferences.rulerUnits = Units.PIXELS;
	}
 
	var doc = app.activeDocument;
	var docFile = doc.fullName;

	var anFile = File.openDialog ("Select the .an file of the destination Edge Animate project.");	
	if(!anFile) return;

	var outputTxt = "";

	var docName = normalizeName(getFileNamePart(doc.name));
	
	var destFolder = anFile.parent;

	var anName = getFileNamePart(anFile.name);

	var imgFolder = new Folder(destFolder.path +"/"+ destFolder.name + "/images/");
	if(!imgFolder.exists) imgFolder.create();
	var imgDestPath = imgFolder.absoluteURI+"/";
	
		
	processLayers(doc, doc.layers, docName, imgDestPath, outputTxt);

	var edgeFile = new File(destFolder.absoluteURI+"/" + anName + "_edge.js");
	saveEdgeAnimateFile(edgeFile, outputTxt);


	function processLayers(doc, layers, prefix, imgDestPath) {
		
		var n = layers.length;
		
		for ( var i = n-1 ; i >= 0 ; i --){
			
			var l = layers[i];
			
			var fileName = prefix + "-" + normalizeName(l.name);
			
			//log(l.name);
			
			// ignore invisible
			if(l.visible == false) continue;

			// ignore adjustment layers
			if(l.kind != LayerKind.NORMAL && l.kind != LayerKind.TEXT) continue;

			
			//groups
			if(l instanceof ArtLayer==false) {
				// TBD: width and height
				outputTxt += outputGroupData(normalizeName(l.name), 0, 0, 500, 500);
				processLayers(doc, l.layers, prefix, imgDestPath);
				outputTxt += "]},";
				continue;
			}
			
			// ignore empty
			if(l.bounds[2]==0) continue;
			
			doc.activeLayer = l;
			
			// TODO limit to shape layers
			l.rasterize (RasterizeType.SHAPE);
			
			selectVisibleIn (l);
			
			var sel = doc.selection;
			
			var x = sel.bounds[0].value;
			var y = sel.bounds[1].value;
			var w = sel.bounds[2].value - x;
			var h = sel.bounds[3].value - y;
			
			log("x: " + x + ", y: " + y + ", w: " + w + ", h: " + h);
			
			outputTxt += outputLayerData(fileName, x, y, w, h);
						 
			doc.selection.copy();			
			
			var newDoc = app.documents.add(w, h, 72, l.name, NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
			
			newDoc.paste();
			
			
			var pngSaveOptions = new PNGSaveOptions(); 
			var saveFile = new File (imgDestPath + fileName + ".png");
			newDoc.saveAs(saveFile, pngSaveOptions, true, Extension.LOWERCASE);	
			newDoc.close(SaveOptions.DONOTSAVECHANGES);
			newDoc = null;
			
		}	
	
		app.preferences.rulerUnits = strtRulerUnits;
	}


	function outputGroupData(name, x, y, w, h){

		var txt = "";
				
		txt += "\t\t{\n\t\t\tid:'" + name + "',\n";
		txt += "\t\t\ttype:'group',\n";
		txt += "\t\t\trect:[" + "'" + x + "', '" + y + "', '" + w + "px', '" + h + "px', " + "'auto','auto'],\n";
		txt += "\t\tc:[\n";
		return txt;		
	}


	function outputLayerData(name, x, y, w, h){	

        var txt = "";
		
		var ext = "png";
				
		txt += "\t\t{\n\t\t\tid:'" + name + "',\n";
		txt += "\t\t\ttype:'image',\n";
		txt += "\t\t\trect:[" + "'" + x + "', '" + y + "', '" + w + "px', '" + h + "px', " + "'auto','auto'],\n";
		txt += "\t\t\tfill:[\"rgba(0,0,0,0)\",im+\"" + name + "." + ext +"\",'0px','0px'" + "]\n";
		txt += "\t\t},\n";
		return txt;
	}


	function saveEdgeAnimateFile(edgeFile, outputTxt){
	//	var edgeFile = new File(destFolder.absoluteURI+"/" + anName + "_edge.js");
		var edgeFileString = getFileString(edgeFile.absoluteURI);	
		var newFileString = edgeFileString.replace("dom: [", "dom: [" + outputTxt);
		saveTextFile(newFileString, edgeFile);	
	}
		
}());
 
