# format-item README

## Features

Two Main Features
* Reformats an openHAB item definition from a single-line item definition to a multi-line item definition.
* Inserts item *templates* for several common item types

### Reformat Items

Reformat Item On Line Containing Cursor
* "mac": "cmd+i cmd+f",
* "win": "ctrl+i ctrl+f",

Reformat All Items In File
* "mac": "cmd+i cmd+l",
* "win": "ctrl+i ctrl+l",

### Insert Items

Insert Generic Item
* "mac": "cmd+i cmd+i",
* "win": "ctrl+i ctrl+i",

Insert Switch Item
* "mac": "cmd+i cmd+s",
* "win": "ctrl+i ctrl+s",

Insert Dimmer Item
* "mac": "cmd+i cmd+d",
* "win": "ctrl+i ctrl+d",

Insert String Item
* "mac": "cmd+i cmd+r",
* "win": "ctrl+i ctrl+r",

Insert Number Item
* "mac": "cmd+i cmd+n",
* "win": "ctrl+i ctrl+n",

Insert DateTime Item
* "mac": "cmd+i cmd+t",
* "win": "ctrl+i ctrl+t",

## Requirements

None

## Extension Settings

### Workspace Settings

When reformatting an item, you can set these parameters to specify

* how much you want to indent the lines of the multiline item, and
* whether you want to preserve any leading whitespace in the reformatted item.

```
{
    "openhab-formatter.indentAmount": 28,
    "openhab-formatter.preserveWhitespace": false
}
```

Default for indentAmount is 28

Default for preserveWhitespace is false

## Example

Converts lines like this.

```
Number:Temperature BedroomTemperature "Bedroom Temperature [%.0f %unit%]" <temperature> (gTemperature) ["Temperature"] { channel="some:binding:local:sensor-temperature" }
```

To lines like this.

```
Number:Temperature          BedroomTemperature
                            "Bedroom Temperature [%.0f %unit%]"
                            <temperature>
                            (gTemperature)
                            ["Temperature"]
                            { channel="some:binding:local:sensor-temperature" }
```

## Release Notes

None

## Other

To build the .vsix file, run the following command.

```
vsce package
```
