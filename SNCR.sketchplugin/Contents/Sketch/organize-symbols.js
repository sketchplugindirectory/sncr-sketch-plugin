@import 'lib/functions.js';

var onRun = function(context) {
	// Document variables
	var doc = context.document;
	var command = context.command;
	var page = doc.currentPage();
	var symbols = page.artboards();
	var symbolCount = symbols.count();

	// If the symbols page is not selected...
	if (page.name() != 'Symbols') {
		// Feedback to user
		displayDialog("Organize Symbols","Please select your symbols page.");
	}
	// If the symbols page is selected...
	else {
		// If there are no symbols...
		if (!symbolCount) {
			// Feedback to user
			displayDialog("Organize Symbols","There are no symbols or organize.");
		}
		// If there are symbols...
		else {
			// Reset page origin
			var pageOrigin = CGPointMake(0,0);
			page.setRulerBase(pageOrigin);

			// Get layout settings
			var layoutSettings = getLayoutSettings();

			// If layout settings were provided...
			if (layoutSettings) {
				// Duplicate symbols object
				var layoutSymbols = symbols;

				// Sort new symbols object by name
				var sortByName = [NSSortDescriptor sortDescriptorWithKey:"name" ascending:1];
				layoutSymbols = [layoutSymbols sortedArrayUsingDescriptors:[sortByName]];

				// Duplicate the sorted symbol object, reverse the order if the user has selected to do so
				var layoutLayers = (layoutSettings.sortOrder == 0) ? [[layoutSymbols reverseObjectEnumerator] allObjects] : layoutSymbols;

				// Sort the layer list
				sortLayerList(layoutLayers);

				// Grouping variables
				var groupCount = 0;
				var groupLayout = [];
				var lastGroupPrefix;

				// Iterate through the symbols
				for (var i = 0; i < symbolCount; i++) {
					// Symbol variables
					var symbol = layoutSymbols.objectAtIndex(i);
					var symbolName = symbol.name();

					// Determine a break point in the symbol name
					var breakPoint = getCharPosition(symbolName,"/",layoutSettings.groupDepth+1);

					// Set a prefix for current group
					var thisGroupPrefix = (breakPoint > 0) ? symbolName.slice(0,breakPoint) : symbolName.slice(0,symbolName.indexOf("/"));

					// If this group prefix is not the same as last group
					if (lastGroupPrefix != thisGroupPrefix) {
						// Increment the group counter
						groupCount++;
					}

					// Add an entry to the group object
					groupLayout.push({
						prefix: thisGroupPrefix,
						group: groupCount
					});

					// Set the last group prefix to current prefix
					lastGroupPrefix = thisGroupPrefix;
				}

				// Layout variables
				var x = 0;
				var y = 0;
				var xPad = parseInt(layoutSettings.xPad);
				var yPad = parseInt(layoutSettings.yPad);
				var groupSpace = 0;

				// Reset the group counter
				var groupCount = 1;

				// Iterate through the group object
				for (var i = 0; i < groupLayout.length; i++) {
					// Symbol variables
					var symbol = layoutSymbols.objectAtIndex(i);
					var symbolFrame = symbol.frame();

					// Layout symbols horizontally or vertically
					if (layoutSettings.sortDirection == 0) {
						// If the current group number doesn't match the group counter
						if (groupLayout[i]['group'] != groupCount) {
							// Reset x position, set the y position of the next row, reset the row height
							y = 0;
							x += groupSpace + xPad;
							groupSpace = 0;

							// Increment the group counter
							groupCount++;
						}

						// Position the symbol
						symbolFrame.x = x;
						symbolFrame.y = y;

						// If this symbol is taller than previous symbols in row
						if (symbolFrame.width() > groupSpace) {
							// Increase the height of the row
							groupSpace = symbolFrame.width();
						}

						// Set the x position for the next symbol
						y += symbolFrame.height() + yPad;
					} else {
						// If the current group number doesn't match the group counter
						if (groupLayout[i]['group'] != groupCount) {
							// Reset x position, set the y position of the next row, reset the row height
							x = 0;
							y += groupSpace + yPad;
							groupSpace = 0;

							// Increment the group counter
							groupCount++;
						}

						// Position the symbol
						symbolFrame.x = x;
						symbolFrame.y = y;

						// If this symbol is taller than previous symbols in row
						if (symbolFrame.height() > groupSpace) {
							// Increase the height of the row
							groupSpace = symbolFrame.height();
						}

						// Set the x position for the next symbol
						x += symbolFrame.width() + xPad;
					}
				}

				// Feedback to user
				doc.showMessage("Symbol layout complete!");
			}
		}
	}

	function getLayoutSettings() {
		// Setting variables
		var groupDepth = 1;
		var sortOrder = 1;
		var sortDirection = 1;
		var xPad = '100';
		var yPad = '100';

		// Get cached settings
		try {
			if ([command valueForKey:"groupDepth" onLayer:page]) {
				groupDepth = [command valueForKey:"groupDepth" onLayer:page];
			}

			if ([command valueForKey:"sortOrder" onLayer:page]) {
				sortOrder = [command valueForKey:"sortOrder" onLayer:page];
			}

			if ([command valueForKey:"sortDirection" onLayer:page]) {
				sortDirection = [command valueForKey:"sortDirection" onLayer:page];
			}

			if ([command valueForKey:"xPad" onLayer:page]) {
				xPad = [command valueForKey:"xPad" onLayer:page];
			}

			if ([command valueForKey:"yPad" onLayer:page]) {
				yPad = [command valueForKey:"yPad" onLayer:page];
			}
		}
		catch(err) {
			log("Unable to fetch settings.");
		}

		var alertWindow = COSAlertWindow.new();

		[alertWindow setMessageText:@'Organize Symbols'];

		[alertWindow addTextLabelWithValue:@'Group depth:'];
		[alertWindow addAccessoryView: createRadioButtons(['Level 1/','Level 1/Level 2/','Level 1/Level 2/Level 3/'],groupDepth)];

		[alertWindow addTextLabelWithValue:@'Sort order:'];
		[alertWindow addAccessoryView: createRadioButtons(['A-Z','Z-A'],sortOrder)];

		[alertWindow addTextLabelWithValue:@'Sort direction:'];
		[alertWindow addAccessoryView: createRadioButtons(['Horizontal','Vertical'],sortDirection)];

		[alertWindow addTextLabelWithValue:@'Horizontal spacing:'];
		[alertWindow addAccessoryView: createField(xPad)];

		[alertWindow addTextLabelWithValue:@'Vertical spacing:'];
		[alertWindow addAccessoryView: createField(yPad)];

		[alertWindow addButtonWithTitle:@'OK'];
		[alertWindow addButtonWithTitle:@'Cancel'];

		var responseCode = alertWindow.runModal();

		if (responseCode == 1000) {
			try {
				[command setValue:[[[alertWindow viewAtIndex:1] selectedCell] tag] forKey:"groupDepth" onLayer:page];
				[command setValue:[[[alertWindow viewAtIndex:3] selectedCell] tag] forKey:"sortOrder" onLayer:page];
				[command setValue:[[[alertWindow viewAtIndex:5] selectedCell] tag] forKey:"sortDirection" onLayer:page];
				[command setValue:[[alertWindow viewAtIndex:7] stringValue] forKey:"xPad" onLayer:page];
				[command setValue:[[alertWindow viewAtIndex:9] stringValue] forKey:"yPad" onLayer:page];
			}
			catch(err) {
				log("Unable to save settings.");
			}

			return {
				groupDepth : [[[alertWindow viewAtIndex:1] selectedCell] tag],
				sortOrder : [[[alertWindow viewAtIndex:3] selectedCell] tag],
				sortDirection : [[[alertWindow viewAtIndex:5] selectedCell] tag],
				xPad : [[alertWindow viewAtIndex:7] stringValue],
				yPad : [[alertWindow viewAtIndex:9] stringValue]
			}
		} else return false;
	}

	function getCharPosition(string,match,count) {
		var position = string.split(match,count).join(match).length;

		if (string.length() != position) {
			return position;
		} else return -1;
	}

	function sortLayerList(layoutSymbols) {
		var parent = page;
		var indices = [];
		var loop = [symbols objectEnumerator], symbol;

		while (symbol = [loop nextObject]) {
			indices.push(parent.indexOfLayer(symbol));
		}

		var removeLoop = [symbols objectEnumerator], symbolToRemove;

		while (symbolToRemove = [removeLoop nextObject]) {
			[symbolToRemove removeFromParent];
		}

		for (var i = 0; i < indices.length; i++) {
			var index = indices[i];
			var sortedSymbol = layoutSymbols[i];
			var layerArray = [NSArray arrayWithObject:sortedSymbol];
			[parent insertLayers:layerArray atIndex:index];
		}

		symbols = page.artboards();
	}
};
