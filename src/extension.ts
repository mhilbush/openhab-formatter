import * as vscode from 'vscode';

const REGEX_COMMENT = /^\s*\/\/.*$/;

// Regex patterns to match parts of item definition
const REGEX_ITEM_TYPE = /(Color|Contact|DateTime|Dimmer|Group|Image|Location|Number|Player|Rollershutter|String|Switch)(:\w+)?(:\w+\((\s*\w+)(,\s*\w+)*\s*\))?/;
const REGEX_ITEM_NAME = /[a-zA-Z0-9][a-zA-Z0-9_]*/;
const REGEX_ITEM_LABEL = /\".+?\"/;
const REGEX_ITEM_ICON = /<.+?>/;
const REGEX_ITEM_GROUP = /\(.+?\)/;
const REGEX_ITEM_TAG = /\[\s*(\".+?\")\s*(,\s*\".+?\"\s*)*]/;
const REGEX_ITEM_CHANNEL = /\{.+?\}/;

// Default item values
const DEF_ITEM_TYPE = 'Type';
const DEF_ITEM_NAME = 'Name';
const DEF_ITEM_LABEL = '"Label [%s]"';
const DEF_ITEM_ICON = '<icon>';
const DEF_ITEM_GROUP = '(group)';
const DEF_ITEM_TAG = '["tag"]';
const DEF_ITEM_CHANNEL = '{ channel="" }\n';

export function activate(context: vscode.ExtensionContext) {
	// Insert a generic item
	vscode.commands.registerCommand('extension.insert-item-generic', () => {
		commandInsertNewGenericItem();
	});

	// Insert a Switch item
	vscode.commands.registerCommand('extension.insert-item-switch', () => {
		commandInsertNewSwitchItem();
	});

	// Insert a Dimmer item
	vscode.commands.registerCommand('extension.insert-item-dimmer', () => {
		commandInsertNewDimmerItem();
	});

	// Insert a String item
	vscode.commands.registerCommand('extension.insert-item-string', () => {
		commandInsertNewStringItem();
	});

	// Insert a Number item
	vscode.commands.registerCommand('extension.insert-item-number', () => {
		commandInsertNewNumberItem();
	});

	// Insert a DateTime item
	vscode.commands.registerCommand('extension.insert-item-datetime', () => {
		commandInsertNewDateTimeItem();
	});

	// Reformat an existing item
	vscode.commands.registerCommand('extension.reformat-item', () => {
		commandReformatItem();
	});

	// Reformat all items in the file
	vscode.commands.registerCommand('extension.reformat-file', () => {
		commandReformatFile();
	});
}

// Add new generic item
function commandInsertNewGenericItem(): void {
	insertItem(DEF_ITEM_TYPE, DEF_ITEM_NAME, DEF_ITEM_LABEL,DEF_ITEM_ICON, DEF_ITEM_GROUP, DEF_ITEM_TAG, DEF_ITEM_CHANNEL);
}

// Add new Switch item
function commandInsertNewSwitchItem(): void {
	insertItem('Switch', '_Switch', '"Label [%s]"', '<switch>', DEF_ITEM_GROUP, '["Switch"]', DEF_ITEM_CHANNEL);
}

// Add new Dimmer item
function commandInsertNewDimmerItem(): void {
	insertItem('Dimmer', '_Dimmer', '"Label [%s]"', '<dimmer>', DEF_ITEM_GROUP, '["Dimmer"]', DEF_ITEM_CHANNEL);
}

// Add new String item
function commandInsertNewStringItem(): void {
	insertItem('String', DEF_ITEM_NAME, '"Label [%s]"', '<text>', DEF_ITEM_GROUP, DEF_ITEM_TAG, DEF_ITEM_CHANNEL);
}

// Add new Number item
function commandInsertNewNumberItem(): void {
	insertItem('Number', DEF_ITEM_NAME, '"Label [%.0f]"', '<none>', DEF_ITEM_GROUP, DEF_ITEM_TAG, DEF_ITEM_CHANNEL);
}

// Add new DateTime item
function commandInsertNewDateTimeItem(): void {
	insertItem('DateTime', DEF_ITEM_NAME, '"Label [%1$tA, %1$tm/%1$td/%1$tY %1$tl:%1$tM %1$tp]"', '<time>', DEF_ITEM_GROUP, DEF_ITEM_TAG, DEF_ITEM_CHANNEL);
}

// Insert a new item whose parts are defined by the passed arguments
function insertItem(type: string, name: string, label: string, icon: string, group: string, tag: string, channel: string): void {
	// Only execute if there's an active text editor
	if (!vscode.window.activeTextEditor) {
		return;
	}
	// Go to beginning of the line, then get an empty range
	let editor = vscode.window.activeTextEditor;
	let newPos = new vscode.Position(editor.selection.active.line, 0);
	editor.selection = new vscode.Selection(newPos, newPos);
	let range = new vscode.Range(newPos,newPos.with(newPos.line, 0));

	let formattedItem = formatItem(type, name, label, icon, group, tag, channel, 0);

	let selection = range;
	editor.edit(builder => {
		builder.replace(selection, formattedItem);
	});
	editor.selection = new vscode.Selection(newPos, newPos);
}

function commandReformatFile(): void {
	// Only execute if there's an active text editor
	if (!vscode.window.activeTextEditor) {
		return;
	}

	let doc = vscode.window.activeTextEditor.document;
	let editor = vscode.window.activeTextEditor;
	let currentPos = editor.selection.active;

	let newPos: vscode.Position;
	editor.edit(builder => {
		for (let index = 0; index < doc.lineCount; index++) {
			newPos = currentPos.with(index, 0);
			editor.selection = new vscode.Selection(newPos, newPos);
			let reformattedItem = reformatItem();
			if (reformattedItem !== "") {
				let selection = new vscode.Range(newPos, newPos.with(newPos.line, doc.lineAt(newPos.line).text.length));
				builder.replace(selection, reformattedItem);
			}
		}
	}).then(success => {
		let pos = new vscode.Position(0,0);
		editor.selection = new vscode.Selection(pos, pos);
	}).then(undefined, err => {
		console.error(err);
	});
}

// Format an existing item definition
function commandReformatItem(): void {
	// Only execute if there's an active text editor
	if (!vscode.window.activeTextEditor) {
		return;
	}

	let doc = vscode.window.activeTextEditor.document;
	let editor = vscode.window.activeTextEditor;
	let currentPos = editor.selection.active;
	let newPos = currentPos.with(currentPos.line, 0);

	editor.edit(builder => {
		let reformattedItem = reformatItem();
		if (reformattedItem !== "") {
			let selection = new vscode.Range(newPos, newPos.with(newPos.line, doc.lineAt(currentPos.line).text.length));
			builder.replace(selection, reformattedItem);
		}
	}).then(success => {
	}).then(undefined, err => {
		console.error(err);
	});
}

function reformatItem(): string {
	// Only execute if there's an active text editor
	if (!vscode.window.activeTextEditor) {
		return "";
	}

	let doc = vscode.window.activeTextEditor.document;
	let editor = vscode.window.activeTextEditor;
	let currentPos = editor.selection.active;

	// Current line must have something in it
	let lineText = doc.lineAt(currentPos.line);
	if (lineText.text.length === 0 || lineText.isEmptyOrWhitespace) {
		return "";
	}
	// Ignore comments
	var comment = doc.getWordRangeAtPosition(currentPos.with(currentPos.line, 0), REGEX_COMMENT);
	if (comment) {
		return "";
	}

	// Default these to empty. They will be changed
	// if they exist in the item definition
	let itemType = '';
	let itemName = '';
	let itemLabel = '';
	let itemIcon = '';
	let itemGroup = '';
	let itemTag = '';
	let itemChannel = '';

	let config = vscode.workspace.getConfiguration('openhab-formatter');
	let preserveWhitespace = config.preserveWhitespace;

	// Position at start of line and get a range for the entire line
	let newPos = currentPos.with(currentPos.line, 0);
	editor.selection = new vscode.Selection(newPos, newPos);

	// Move to after the whitespace
	let leadingWhitespaceCount = lineText.firstNonWhitespaceCharacterIndex;
	newPos = newPos.with(newPos.line, leadingWhitespaceCount);

	if (preserveWhitespace === false) {
		// Set to 0 if not preserving leading whitespace
		leadingWhitespaceCount = 0;
	}

	// Discover item Type
	var wordRange = doc.getWordRangeAtPosition(newPos, REGEX_ITEM_TYPE);
	if (wordRange && wordRange.isSingleLine) {
		itemType = doc.getText(wordRange);
		// FIXME console.log("Matched type: " + itemType);
		newPos = newPos.with(newPos.line, newPos.character + itemType.length);
		newPos = newPos.with(newPos.line, newPos.character + countWhitespace(doc, newPos));
		// Discover item Name
		var itemNameRange = doc.getWordRangeAtPosition(newPos, REGEX_ITEM_NAME);
		if (itemNameRange && itemNameRange.isSingleLine) {
			itemName = doc.getText(itemNameRange);
			// FIXME console.log("Matched name: " + itemName);
			newPos = newPos.with(newPos.line, newPos.character + itemName.length);
			newPos = newPos.with(newPos.line, newPos.character + countWhitespace(doc, newPos));
		}
	}
	// Must have a type and name to continue
	if (itemType.length === 0 || itemName.length === 0) {
		return "";
	}
	// Discover item Label
	let itemLabelRange = doc.getWordRangeAtPosition(newPos, REGEX_ITEM_LABEL);
	if (itemLabelRange && itemLabelRange.isSingleLine) {
		itemLabel = doc.getText(itemLabelRange);
		//console.log("Label: " + itemLabel);
		newPos = newPos.with(newPos.line, newPos.character + itemLabel.length);
		newPos = newPos.with(newPos.line, newPos.character + countWhitespace(doc, newPos));
	}
	// Discover item Icon
	let itemIconRange = doc.getWordRangeAtPosition(newPos, REGEX_ITEM_ICON);
	if (itemIconRange && itemIconRange.isSingleLine) {
		itemIcon = doc.getText(itemIconRange);
		newPos = newPos.with(newPos.line, newPos.character + itemIcon.length);
		newPos = newPos.with(newPos.line, newPos.character + countWhitespace(doc, newPos));
	}
	// Discover item Group
	let itemGroupRange = doc.getWordRangeAtPosition(newPos, REGEX_ITEM_GROUP);
	if (itemGroupRange && itemGroupRange.isSingleLine) {
		itemGroup = doc.getText(itemGroupRange);
		newPos = newPos.with(newPos.line, newPos.character + itemGroup.length);
		newPos = newPos.with(newPos.line, newPos.character + countWhitespace(doc, newPos));
	}
	// Discover item Tag
	let itemTagRange = doc.getWordRangeAtPosition(newPos, REGEX_ITEM_TAG);
	if (itemTagRange && itemTagRange.isSingleLine) {
		itemTag = doc.getText(itemTagRange);
		//console.log("Tag: " + itemTag);
		newPos = newPos.with(newPos.line, newPos.character + itemTag.length);
		newPos = newPos.with(newPos.line, newPos.character + countWhitespace(doc, newPos));
	}
	// Discover item Channel
	let itemChannelRange = doc.getWordRangeAtPosition(newPos, REGEX_ITEM_CHANNEL);
	if (itemChannelRange && itemChannelRange.isSingleLine) {
		itemChannel = doc.getText(itemChannelRange);
		newPos = newPos.with(newPos.line, newPos.character + itemChannel.length);
		newPos = newPos.with(newPos.line, newPos.character + countWhitespace(doc, newPos));
	}
	// Return the reformatted version of the item
	return formatItem(itemType, itemName, itemLabel, itemIcon, itemGroup, itemTag, itemChannel, leadingWhitespaceCount);
}

function formatItem(type: string, name: string, label: string,
	icon: string, group: string, tag: string, channel: string, additionalIndent : number): string {

	let config = vscode.workspace.getConfiguration('openhab-formatter');
	let indentAmount = config.indentAmount;

	// If type is longer than the indent, make sure there's at least one space
	let typeNameIndent : string;
	if (type.length < indentAmount) {
		typeNameIndent = indent(indentAmount - type.length);
	} else {
		typeNameIndent = indent(1);
	}

	let formattedItem = indent(additionalIndent) + type + typeNameIndent + name + "\n";
	if(label.length !== 0) {
		formattedItem = formattedItem + indent(additionalIndent + indentAmount) + label + "\n";
	}
	if(icon.length !== 0) {
		formattedItem = formattedItem + indent(additionalIndent + indentAmount) + icon + "\n";
	}
	if(group.length !== 0) {
		formattedItem = formattedItem + indent(additionalIndent + indentAmount) + group + "\n";
	}
	if(tag.length !== 0) {
		formattedItem = formattedItem + indent(additionalIndent + indentAmount) + tag + "\n";
	}
	if(channel.length !== 0) {
		formattedItem = formattedItem + indent(additionalIndent + indentAmount) + channel + "\n";
	}
	return formattedItem;
}

// Count the amount of whitespace starting at startPos
function countWhitespace(doc: vscode.TextDocument, startPos: vscode.Position): number {
	let whitespaceRange = doc.getWordRangeAtPosition(startPos, /[ \t]+/);
	if (whitespaceRange && whitespaceRange.isSingleLine) {
		return doc.getText(whitespaceRange).length;
	}
	return 0;
}

// Return a string of 'number' spaces
function indent(count: number): string {
	let spaces = "";
	for(let i = 0; i < count; i++) {
		spaces = spaces + " ";
	}
	return spaces;
}

// this method is called when your extension is deactivated
export function deactivate() {
}
