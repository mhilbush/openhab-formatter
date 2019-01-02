import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	//console.log('Activating "format-item" extension');

	let disposable = vscode.commands.registerCommand('extension.format-item', () => {
		// Only execute if there's an active text editor
		if (!vscode.window.activeTextEditor) {
			return;
		}
		let doc = vscode.window.activeTextEditor.document;
		let ed = vscode.window.activeTextEditor;
		let currentPos = ed.selection.active;
		let newPos: vscode.Position;

		// Current line must have something in it
		var lineText = doc.lineAt(currentPos.line);
		//console.log('Line: length=' + lineText.text.length + ' text=' + lineText.text);
		if (lineText.text.length === 0 || lineText.isEmptyOrWhitespace) {
			return;
		}
		// Ignore comments
		if (lineText.text.startsWith('//')) {
			return;
		}

		let regexItemType = /(Switch|Dimmer|Number|String|Image):*(\w)*/;
		let regexItemName = /[a-zA-Z0-9][a-zA-Z0-9_]*/;
		let regexItemLabel = /\".+?\"/;
		let regexItemIcon = /<.+?>/;
		let regexItemGroup = /\(.+?\)/;
		let regexItemTag = /\[.+?\]/;
		let regexItemChannel = /\{.+?\}/;

		let itemType = '';
		let itemName = '';
		let itemLabel = '';
		let itemIcon = '';
		let itemGroup = '';
		let itemTag = '';
		let itemChannel = '';

		// Position at start of line
		newPos = currentPos.with(currentPos.line, 0);
        ed.selection = new vscode.Selection(newPos, newPos);

		let range = new vscode.Range(newPos,newPos.with(newPos.line, lineText.text.length));

		// Type
		var wordRange = doc.getWordRangeAtPosition(newPos, regexItemType);
		if (wordRange && wordRange.isSingleLine) {
			itemType = doc.getText(wordRange);
			//console.log('ItemType: length=' + itemType.length + ' text=' + itemType);
			newPos = newPos.with(newPos.line, newPos.character + itemType.length);
			newPos = newPos.with(newPos.line, newPos.character + countWhitespace(doc, newPos));
			// Name
			var itemNameRange = doc.getWordRangeAtPosition(newPos, regexItemName);
			if (itemNameRange && itemNameRange.isSingleLine) {
				itemName = doc.getText(itemNameRange);
				//console.log('ItemName: length=' +  + ' text=' + itemName);
				newPos = newPos.with(newPos.line, newPos.character + itemName.length);
				newPos = newPos.with(newPos.line, newPos.character + countWhitespace(doc, newPos));
			}
		}
		// Must have a type and name to continue
		if (itemType.length === 0 || itemName.length === 0) {
			return;
		}
		// Label
		var itemLabelRange = doc.getWordRangeAtPosition(newPos, regexItemLabel);
		if (itemLabelRange && itemLabelRange.isSingleLine) {
			itemLabel = doc.getText(itemLabelRange);
			//console.log('ItemLabel: length=' + itemLabel.length + ' text=' + itemLabel);
			newPos = newPos.with(newPos.line, newPos.character + itemLabel.length);
			newPos = newPos.with(newPos.line, newPos.character + countWhitespace(doc, newPos));
		}
		// Icon
		var itemIconRange = doc.getWordRangeAtPosition(newPos, regexItemIcon);
		if (itemIconRange && itemIconRange.isSingleLine) {
			itemIcon = doc.getText(itemIconRange);
			//console.log('ItemIcon: length=' + itemIcon.length + ' text=' + itemIcon);
			newPos = newPos.with(newPos.line, newPos.character + itemIcon.length);
			newPos = newPos.with(newPos.line, newPos.character + countWhitespace(doc, newPos));
		}
		// Group
		var itemGroupRange = doc.getWordRangeAtPosition(newPos, regexItemGroup);
		if (itemGroupRange && itemGroupRange.isSingleLine) {
			itemGroup = doc.getText(itemGroupRange);
			//console.log('ItemGroup: length=' + itemGroup.length + ' text=' + itemGroup);
			newPos = newPos.with(newPos.line, newPos.character + itemGroup.length);
			newPos = newPos.with(newPos.line, newPos.character + countWhitespace(doc, newPos));
		}
		// Tag
		var itemTagRange = doc.getWordRangeAtPosition(newPos, regexItemTag);
		if (itemTagRange && itemTagRange.isSingleLine) {
			itemTag = doc.getText(itemTagRange);
			//console.log('ItemTag: length=' + itemTag.length + ' text=' + itemTag);
			newPos = newPos.with(newPos.line, newPos.character + itemTag.length);
			newPos = newPos.with(newPos.line, newPos.character + countWhitespace(doc, newPos));
		}
		// Channel
		var itemChannelRange = doc.getWordRangeAtPosition(newPos, regexItemChannel);
		if (itemChannelRange && itemChannelRange.isSingleLine) {
			itemChannel = doc.getText(itemChannelRange);
			//console.log('ItemChannel: length=' + itemChannel.length + ' text=' + itemChannel);
			newPos = newPos.with(newPos.line, newPos.character + itemChannel.length);
			newPos = newPos.with(newPos.line, newPos.character + countWhitespace(doc, newPos));
		}
		reformatLine(ed, range, itemType, itemName, itemLabel, itemIcon, itemGroup, itemTag, itemChannel);
	});
	context.subscriptions.push(disposable);
}

function reformatLine(ed: vscode.TextEditor, range: vscode.Range, type: string, name: string, label: string,
	icon: string, group: string, tag: string, channel: string): void {

	// Create text for new line
	var reformattedItem = type + indent(25 - type.length) + name + "\n";
	if(label.length !== 0) {
		reformattedItem = reformattedItem + indent(25) + label + "\n";
	}
	if(icon.length !== 0) {
		reformattedItem = reformattedItem + indent(25) + icon + "\n";
	}
	if(group.length !== 0) {
		reformattedItem = reformattedItem + indent(25) + group + "\n";
	}
	if(tag.length !== 0) {
		reformattedItem = reformattedItem + indent(25) + tag + "\n";
	}
	if(channel.length !== 0) {
		reformattedItem = reformattedItem + indent(25) + channel + "\n";
	}
	//console.log('Reformatted item=\n' + reformattedItem);

	let selection = range;
	ed.edit(builder => {
		builder.replace(selection, reformattedItem);
	});
}

function countWhitespace(doc: vscode.TextDocument, startPos: vscode.Position): number {
	var whitespaceRange = doc.getWordRangeAtPosition(startPos, /[ \t]+/);
	if (whitespaceRange && whitespaceRange.isSingleLine) {
		return doc.getText(whitespaceRange).length;
	}
	return 0;
}

function indent(count: number): string {
	var spaces = "";
	for(var i = 0; i < count; i++) {
		spaces = spaces + " ";
	}
	return spaces;
}

// this method is called when your extension is deactivated
export function deactivate() {}
