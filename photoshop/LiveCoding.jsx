﻿//#target photoshop#include "../common/Utils.jsx" function main() {	if ( app.documents.length > 0 ) {				var doc = app.activeDocument;					var l = doc.layers[0];					log(l.kind );		}}main();