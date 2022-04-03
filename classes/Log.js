// @ts-check

"use strict";

// Imports
const Events = require("node:events");
const fs = require("node:fs");
const path = require("node:path");

/**
 * Log system
 * @class
 * @extends {Events}
 */
class Log extends Events {
    /**
     * Default date time formatter
     * @static
     * @type {Intl.DateTimeFormat}
     */
    static defaultDateTimeFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "short", timeStyle: "medium" });

    /**
     * Creates a new log file
     * @constructor
     * @param {object} [options] Options (Default: {})
     * @param {boolean} [options.autoClose] Automatically closes the write stream to prevent corruption (Default: false)
     * @param {boolean} [options.autoCreate] Automatically creates the log file if it does not exist (Default: false)
     * @param {boolean} [options.autoOpen] Automatically opens the write stream if it is closed (Default: false)
     * @param {string} [options.file] File path of the log file (Default: "logs/latest.log")
     * @param {(...parameters: any) => string} [options.formatter] Formatter function (Default: Log.defaultFormatter)
     * @param {any[]} [options.formatterParameters] Formatter parameters (Default: [])
     * @param {number} [options.lifetime] Lifetime of the log file (Default: Infinity)
     * @param {boolean} [options.recursive] Creates the log file recursively through the directory (Default: true)
     * @param {boolean} [options.truncate] Automatically truncates the log file upon opening the write stream (Default: true)
     */
    constructor(options = {}) {
        super();
        /**
         * Parsed options
         * @type {options}
         */
        let parsedOptions = Object.assign({
            autoClose: false,
            autoCreate: false,
            autoOpen: false,
            file: "logs/latest.log",
            formatter: Log.defaultFormatter,
            formatterParameters: [],
            recursive: true,
            truncate: false,
        }, options);

        /**
         * Options
         * @type {options}
         */
        this.options = parsedOptions;

        /**
         * Write stream of the log file
         * @type {fs.WriteStream?}
         */
        this.stream = null;
    };

    /**
     * Closes the write stream
     * @fires Log#beforeClose
     * @fires Log#close
     * @returns {this} This instance
     */
    close() {
        if(!this.stream) throw new Error("Write stream is already closed");
        /**
         * Emits before the write stream is closed
         * @event Log#beforeClose
         * @param {fs.WriteStream} stream Write stream
         */
        super.emit("beforeClose", this.stream);
        this.stream.destroy();
        this.emit("close", this.stream);
        this.stream = null;
        return this;
    };

    /**
     * Reads the log file synchronously and returns its content
     * @readonly
     * @returns {string} Content of the log file
     */
    get content() {
        return fs.readFileSync(this.file).toString();
    };

    /**
     * Creates the log file
     * @fires Log#beforeCreate
     * @fires Log#create
     * @param {object} [options] Options (Default: {})
     * @param {boolean} [options.recursive] Creates the log file recursively through the directory (Default: true)
     * @returns {this} This instance
     */
    create(options = {}) {
        let parsedOptions = Object.assign({
            recursive: true
        }, this.options, options);
        if(this.exists) return this;
        super.emit("beforeCreate");
        if(!fs.existsSync(path.dirname(this.file))) fs.mkdirSync(path.dirname(this.file), {
            recursive: parsedOptions.recursive
        });
        fs.openSync(this.file, "w+");
        super.emit("create");
        return this;
    };

    /**
     * Deletes the log file
     * @fires Log#beforeDelete
     * @fires Log#delete
     * @param {object} [options] Options (Default: {})
     * @param {boolean} [options.autoClose] Automatically closes the write stream to prevent corruption (Default: false)
     * @returns {this} This instance
     */
    delete(options = {}) {
        let parsedOptions = Object.assign({
            autoClose: false
        }, this.options, options);
        if(!this.exists) throw new Error("Log file does not exist");
        if(this.stream) {
            if(parsedOptions.autoClose) this.close();
            else throw new Error("Write stream is not closed");
        };
        super.emit("beforeDelete", parsedOptions);
        fs.unlinkSync(this.file);
        super.emit("delete", parsedOptions);
        return this;
    };

    /**
     * Formats an entry
     * @param {object} [options] Options (Default: {})
     * @param {Date|number} [options.dateTime] Timestamp of the entry (Default: Date.now())
     * @param {"LEFT" | "RIGHT"} [options.dateTimeAlignment] Alignment of the timestamp (Default: "LEFT")
     * @param {Intl.DateTimeFormat} [options.dateTimeFormatter] Date time formatter (Default: Log.defaultDateTimeFormatter)
     * @param {number} [options.dateTimeMinimumWidth] Minimum width of the timestamp (Default: 25)
     * @param {string} [options.dateTimePadding] Padding of the timestamp (Default: " ")
     * @param {(number | number[] | string | string[])[]} [options.dateTimeStyling] Timestamp styling (Default: [ 94, 1 ])
     * @param {string} [options.end] String terminator (Default: "\n")
     * @param {string} [options.message] Message of the entry (Default: "MESSAGE")
     * @param {(number | number[] | string | string[])[]} [options.messageStyling] Message styling (Default: [ 92 ])
     * @param {boolean} [options.raw] Disables all styling (Default: true)
     * @param {string} [options.separator] Separator between each field (Default: " | ")
     * @param {(number | number[] | string | string[])[]} [options.separatorStyling] Separator styling (Default: [ 90, 1 ])
     * @param {string} [options.title] Title of the entry (Default: "TITLE")
     * @param {"LEFT" | "RIGHT"} [options.titleAlignment] Alignment of the title (Default: "LEFT")
     * @param {number} [options.titleMinimumWidth] Minimum width of the title (Default: 20)
     * @param {string} [options.titlePadding] Padding of the title (Default: " ")
     * @param {(number | number[] | string | string[])[]} [options.titleStyling] Title styling (Default: [ 93, 1 ])
     * @returns {string} Formatted entry
     */
    static defaultFormatter(options) {
        let parsedOptions = Object.assign({
            dateTime: Date.now(),
            dateTimeAlignment: "LEFT",
            dateTimeFormatter: Log.defaultDateTimeFormatter,
            dateTimeMinimumWidth: 25,
            dateTimePadding: " ",
            dateTimeStyling: [ 94, 1 ],
            end: "\n",
            message: "MESSAGE",
            messageStyling: [ 92 ],
            raw: true,
            separator: " | ",
            separatorStyling: [ 90, 1 ],
            title: "TITLE",
            titleAlignment: "LEFT",
            titleMinimumWidth: 20,
            titlePadding: " ",
            titleStyling: [ 93, 1 ],
        }, Object(options));
        let parsedDateTime = parsedOptions.dateTimeFormatter.format(parsedOptions.dateTime)
            [parsedOptions.dateTimeAlignment.toUpperCase() === "RIGHT" ? "padStart" : "padEnd"](parsedOptions.dateTimeMinimumWidth, parsedOptions.dateTimePadding);
        let parsedTitle = parsedOptions.title
            [parsedOptions.titleAlignment.toUpperCase() === "RIGHT" ? "padStart" : "padEnd"](parsedOptions.titleMinimumWidth, parsedOptions.titlePadding);
        if(parsedOptions.raw) return [ parsedDateTime, parsedTitle, parsedOptions.message ].join(parsedOptions.separator) + parsedOptions.end;
        let [ styledDateTime, styledTitle, styledMessage, styledSeparator ] = [
            { styles: parsedOptions.dateTimeStyling, text: parsedDateTime },
            { styles: parsedOptions.titleStyling, text: parsedTitle },
            { styles: parsedOptions.messageStyling, text: parsedOptions.message },
            { styles: parsedOptions.separatorStyling, text: parsedOptions.separator }
        ].map(v => v.styles.map(u => `\x1b[${Array.isArray(u) ? u.join(";") : u}m`).join("") + v.text + "\x1b[0m");
        return [ styledDateTime, styledTitle, styledMessage ].join(styledSeparator) + parsedOptions.end;
    };

    /**
     * Returns whether or not the log file exists
     * @readonly
     * @returns {boolean} Whether or not the log file exists
     */
    get exists() {
        return fs.existsSync(this.file);
    };

    /**
     * Returns the resolved path of the log file
     * @readonly
     * @returns {string} Resolved path of the log file
     */
    get file() {
        return path.resolve(this.options.file);
    };

    /**
     * Opens the write stream
     * @fires Log#beforeOpen
     * @fires Log#open
     * @param {object} [options] Options (Default: {})
     * @param {boolean} [options.autoCreate] Automatically creates the log file if it does not exist (Default: false)
     * @param {boolean} [options.recursive] Creates the log file recursively through the directory (Default: true)
     * @param {boolean} [options.truncate] Automatically truncates the log file upon opening the write stream (Default: true)
     * @returns {this} This instance
     */
    open(options = {}) {
        let parsedOptions = Object.assign({
            autoCreate: false,
            truncate: true
        }, this.options, options);
        if(!this.exists) {
            if(parsedOptions.autoCreate) this.create(parsedOptions);
            else throw new Error("Log file does not exist");
        };
        if(this.stream) return this;
        super.emit("beforeOpen", parsedOptions);
        let content = parsedOptions.truncate ? "" : this.content;
        this.stream = fs.createWriteStream(this.file);
        this.stream.write(content);
        super.emit("open", parsedOptions);
        return this;
    };

    /**
     * Creates a readable stream of the file
     * @param {import("node:fs/promises").CreateReadStreamOptions} [options] Options
     * @returns {fs.ReadStream} Readable stream
     */
    read(options) {
        return fs.createReadStream(this.file, options);
    };

    /**
     * Writes an entry to the log file
     * @fires Log#beforeWrite
     * @fires Log#write
     * @param {object} options 
     * @param {boolean} [options.autoCreate] Automatically creates the log file if it does not exist (Default: false)
     * @param {boolean} [options.autoOpen] Automatically opens the write stream if it is closed (Default: false)
     * @param {(...parameters: any) => string} [options.formatter] Formatter function (Default: Log.defaultFormatter)
     * @param {any[]} [options.formatterParameters] Formatter parameters (Default: [])
     * @param {boolean} [options.recursive] Creates the log file recursively through the directory (Default: true)
     * @param {boolean} [options.truncate] Automatically truncates the log file upon opening the write stream (Default: true)
     * @param {...any} [formatterParameters] Parameters for the formatter
     * @returns {this} This instance
     */
    write(options, ...formatterParameters) {
        let parsedOptions = Object.assign({
            autoCreate: false,
            autoOpen: false,
            formatter: Log.defaultFormatter,
            formatterParameter: [],
            recursive: true,
            truncate: true
        }, this.options, options);
        Object.assign(parsedOptions.formatterParameters, formatterParameters);
        if(!this.exists) {
            if(this.options.autoCreate) this.create(parsedOptions);
            else throw new Error("Log file does not exist");
        };
        if(!this.stream) {
            if(this.options.autoOpen) this.open(parsedOptions);
            else throw new Error("Write stream is is not opened");
        };
        super.emit("beforeWrite", parsedOptions);
        let entry = parsedOptions.formatter(...parsedOptions.formatterParameters);
        this.stream.write(entry);
        super.emit("write", entry, parsedOptions);
        return this;
    };
};

// Exports
module.exports = Log;