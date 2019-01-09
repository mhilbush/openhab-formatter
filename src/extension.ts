import * as vscode from 'vscode';

// Default indent amount for item parts
const INDENT_AMOUNT = 28;

// Regex patterns to match parts of item definition
const REGEX_ITEM_TYPE = /(Color|Contact|DateTime|Dimmer|Group|Image|Location|Number|Player|Rollershutter|String|Switch):*(\w)*:*[\w\(\),]*/;
const REGEX_ITEM_NAME = /[a-zA-Z0-9][a-zA-Z0-9_]*/;
const REGEX_ITEM_LABEL = /\".+?\"/;
const REGEX_ITEM_ICON = /<.+?>/;
const REGEX_ITEM_GROUP = /\(.+?\)/;
const REGEX_ITEM_TAG = /\[.+?\]/;
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

	// Format an existing item
	vscode.commands.registerCommand('extension.format-item', () => {
		commandFormatItem();
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
	insertItem('Number', DEF_ITEM_NAME, '"Label [%.0f]"', '<none', DEF_ITEM_GROUP, DEF_ITEM_TAG, DEF_ITEM_CHANNEL);
}

// Add new DateTime item
function commandInsertNewDateTimeItem(): void {
	insertItem('DateTime', DEF_ITEM_NAME, '"Label [%1$tA, %1$tm/%1$td/%1$tY %1$tl:%1$tM %1$tp]"', '<time>',
		DEF_ITEM_GROUP, DEF_ITEM_TAG, DEF_ITEM_CHANNEL);
}

// Insert a new item whose parts are defined by the passed arguments
function insertItem(type: string, name: string, label: string, icon: string,
	group: string, tag: string, channel: string): void {

	// Only execute if there's an active text editor
	if (!vscode.window.activeTextEditor) {
		return;
	}
	// Go to beginning of the line, then get an empty range
	let editor = vscode.window.activeTextEditor;
	let newPos = new vscode.Position(editor.selection.active.line, 0);
	editor.selection = new vscode.Selection(newPos, newPos);
	let range = new vscode.Range(newPos,newPos.with(newPos.line, 0));

	insertFormattedItem(editor, range, type, name, label, icon, group, tag, channel);

	editor.selection = new vscode.Selection(newPos, newPos);
}

// Format an existing item definition
function commandFormatItem(): void {
	// Only execute if there's an active text editor
	if (!vscode.window.activeTextEditor) {
		return;
	}

	let doc = vscode.window.activeTextEditor.document;
	let ed = vscode.window.activeTextEditor;
	let currentPos = ed.selection.active;
	let newPos: vscode.Position;

	// Current line must have something in it
	let lineText = doc.lineAt(currentPos.line);
	if (lineText.text.length === 0 || lineText.isEmptyOrWhitespace) {
		return;
	}
	// Ignore comments
	if (lineText.text.startsWith('//')) {
		return;
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

	// Position at start of line, then get a range that includes the entire line
	newPos = currentPos.with(currentPos.line, 0);
	ed.selection = new vscode.Selection(newPos, newPos);
	let range = new vscode.Range(newPos,newPos.with(newPos.line, lineText.text.length));

	// Discover item Type
	var wordRange = doc.getWordRangeAtPosition(newPos, REGEX_ITEM_TYPE);
	if (wordRange && wordRange.isSingleLine) {
		itemType = doc.getText(wordRange);
		newPos = newPos.with(newPos.line, newPos.character + itemType.length);
		newPos = newPos.with(newPos.line, newPos.character + countWhitespace(doc, newPos));
		// Discover item Name
		var itemNameRange = doc.getWordRangeAtPosition(newPos, REGEX_ITEM_NAME);
		if (itemNameRange && itemNameRange.isSingleLine) {
			itemName = doc.getText(itemNameRange);
			newPos = newPos.with(newPos.line, newPos.character + itemName.length);
			newPos = newPos.with(newPos.line, newPos.character + countWhitespace(doc, newPos));
		}
	}
	// Must have a type and name to continue
	if (itemType.length === 0 || itemName.length === 0) {
		return;
	}
	// Discover item Label
	let itemLabelRange = doc.getWordRangeAtPosition(newPos, REGEX_ITEM_LABEL);
	if (itemLabelRange && itemLabelRange.isSingleLine) {
		itemLabel = doc.getText(itemLabelRange);
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
	// Replace the exiting item with a reformatted one
	insertFormattedItem(ed, range, itemType, itemName, itemLabel, itemIcon, itemGroup, itemTag, itemChannel);
}

function insertFormattedItem(ed: vscode.TextEditor, range: vscode.Range, type: string, name: string, label: string,
	icon: string, group: string, tag: string, channel: string): void {

	// Create text for new line
	let reformattedItem = type + indent(INDENT_AMOUNT - type.length) + name + "\n";
	if(label.length !== 0) {
		reformattedItem = reformattedItem + indent(INDENT_AMOUNT) + label + "\n";
	}
	if(icon.length !== 0) {
		reformattedItem = reformattedItem + indent(INDENT_AMOUNT) + icon + "\n";
	}
	if(group.length !== 0) {
		reformattedItem = reformattedItem + indent(INDENT_AMOUNT) + group + "\n";
	}
	if(tag.length !== 0) {
		reformattedItem = reformattedItem + indent(INDENT_AMOUNT) + tag + "\n";
	}
	if(channel.length !== 0) {
		reformattedItem = reformattedItem + indent(INDENT_AMOUNT) + channel + "\n";
	}

	let selection = range;
	ed.edit(builder => {
		builder.replace(selection, reformattedItem);
	});
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
