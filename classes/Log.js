// @ts-check

"use strict";

// Type Definitions
/**
 * Log options and customizations
 * @typedef {object} LogOptions
 * @property {boolean} [automaticClose] Automatically closes the log file (Default: true)
 * @property {boolean} [automaticCreate] Automatically creates the log file (Default: true)
 * @property {boolean} [automaticOpen] Automatically opens the log file (Default: true)
 * @property {function} [formatter] Formatter (Default: Log.defaultFormatter)
 * @property {function} [logger] Logger (Default: Log.defaultLogger)
 * @property {boolean} [recursive] Recursively creates the log file through the directory (Default: true)
 */
/**
 * Default formatter options
 * @typedef {object} DefaultFormatterOptions
 * @property {Date|number} [dateTime] Date time of entry (Default: Date.now())
 * @property {"LEFT" | "RIGHT"} [dateTimeAlignment] Date time alignment (Default: "LEFT")
 * @property {Intl.DateTimeFormat} [dateTimeFormatter] Date time formatter (Default: Log.defaultDateTimeFormatter)
 * @property {number} [dateTimeMinimumWidth] Minimum width of date time (Default: 25)
 * @property {string} [dateTimePadding] Padding of date time (Default: " ")
 * @property {number | string | (number | number[] | string | string[])[]} [dateTimeStyling] Styling of date time (Default: [ 1, 94 ])
 * @property {string} [end] Entry terminator (Default: "\n")
 * @property {string} [message] Message of entry (Default: "MESSAGE")
 * @property {number | string | (number | number[] | string | string[])[]} [messageStyling] Styling of message (Default: 92)
 * @property {string} [separator] Field separator (Default: " | ")
 * @property {string} [title] Title of entry (Default: "TITLE")
 * @property {"LEFT" | "RIGHT"} [titleAlignment] Title alignment (Default: "LEFT")
 * @property {number} [titleMinimumWidth] Minimum width of title (Default: 20)
 * @property {string} [titlePadding] Padding of title (Default: " ")
 * @property {number | string | (number | number[] | string | string[])[]} [titleStyling] Styling of title (Default: [ 1, 93 ])
 */
/**
 * Default logger options
 * @typedef {object} DefaultLoggerOptions
 * @property {boolean} [automaticCreate] Automatically creates the log file (Default: true)
 * @property {boolean} [automaticOpen] Automatically opens the log file (Default: true)
 * @property {boolean} [print] Prints entry to terminal (Default: true)
 * @property {boolean} [printRaw] Prints raw entry to terminal (Default: false)
 * @property {boolean} [recursive] Recursively creates the log file through the directory (Default: true) 
 * @property {boolean} [write] Writes entry to file (Default: true)
 * @property {boolean} [writeRaw] Writes raw entry to file (Default: true)
 */

// Imports
const Events = require("node:events");
const fs = require("node:fs");
const path = require("node:path");

class Log extends Events {
    /**
     * File path
     * @type {string}
     */
    #file;

    /**
     * Formatter
     * @type {function}
     */
    #formatter;

    /**
     * Logger
     * @type {function}
     */
    #logger;

    /**
     * Log options
     * @type {LogOptions}
     */
    #options;

    /**
     * Write stream
     * @type {fs.WriteStream?}
     */
    #stream;

    /**
     * Date time formatter
     * @static
     * @type {Intl.DateTimeFormat}
     */
    static defaultDateTimeFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "short", timeStyle: "medium" });

    /**
     * Creates a new log file
     * @param {string} file File path
     * @param {LogOptions} [options] Options
     */
    constructor(file, options = {}) {
        super();
        this.file = file;
        this.options = options;
    };

    /**
     * Closes the log stream
     * @param {LogOptions} [options] Log options override
     * @returns {this} This
     */
    close(options) {
        let override = Object.assign(this.options, Object(options));
        if(override.automaticCreate) this.create(override);
        if(!this.online) return this;
        this.#stream.once("close", () => {
            super.emit("close", this.#stream);
            this.#stream = null;
        });
        super.emit("beforeClose");
        this.#stream.destroy();
    };

    /**
     * Current content of the log file
     * @readonly
     * @returns {string} File content
     */
    get content() {
        return fs.readFileSync(this.file).toString();
    };

    /**
     * Creates the log file
     * @param {LogOptions} [options] Log options override
     * @returns {this} This
     */
    create(options) {
        let override = Object.assign(this.options, Object(options));
        if(this.exists) return this;
        let file = this.file, directory = path.dirname(file);
        if(!fs.existsSync(directory)) fs.mkdirSync(directory, override);
        fs.openSync(file, "w+");
        super.emit("create");
        return this;
    };

    /**
     * Default formatter
     * @param {DefaultFormatterOptions} [options] Formatter options override
     * @returns {string} Formatted entry
     */
    static defaultFormatter(options = {}) {
        if(!(this instanceof Log)) throw new TypeError("Please bind this function to an instance of the log");
        let override = Object.assign({
            dateTime: Date.now(),
            dateTimeAlignment: "LEFT",
            dateTimeFormatter: Log.defaultDateTimeFormatter,
            dateTimeMinimumWidth: 25,
            dateTimePadding: " ",
            dateTimeStyling: [ 1, 94 ],
            end: "\n",
            message: "MESSAGE",
            messageStyling: 92,
            separator: " | ",
            separatorStyling: [ 1, 90 ],
            title: "TITLE",
            titleAlignment: "LEFT",
            titleMinimumWidth: 20,
            titlePadding: " ",
            titleStyling: [ 1, 93 ]
        }, Object(options));
        let dateTime = override.dateTimeFormatter.format(override.dateTime)
            [override.dateTimeAlignment === "RIGHT" ? "padStart" : "padEnd"](override.dateTimeMinimumWidth, override.dateTimePadding);
        let title = override.title[override.titleAlignment === "RIGHT" ? "padStart" : "padEnd"](override.titleMinimumWidth, override.titlePadding);
        let [ styledDateTime, styledTitle, styledMessage, styledSeparator ] = [
            { styling: override.dateTimeStyling, text: dateTime },
            { styling: override.titleStyling, text: title }, 
            { styling: override.messageStyling, text: override.message },
            { styling: override.separatorStyling, text: override.separator }
        ].map(v => `${
            Array.isArray(v.styling) ?
            v.styling.map(w => `\x1b[${Array.isArray(w) ? w.join(";") : w}m`).join("") :
            `\x1b[${v.styling}m`
        }${v.text}${(Array.isArray(v.styling) && !v.styling.length) ? "" : "\x1b[0m"}`);
        return [ styledDateTime, styledTitle, styledMessage ].join(styledSeparator) + override.end;
    };

    /**
     * Logs the message to the log file and terminal
     * @param {DefaultFormatterOptions} [formatOptions]
     * @param {DefaultLoggerOptions} [logOptions]
     */
    static defaultLogger(formatOptions = {}, logOptions = {}) {
        if(!(this instanceof Log)) throw new TypeError("Please bind this function to an instance of the log");
        let logOverride = Object.assign({
            automaticCreate: true,
            automaticOpen: true,
            print: true,
            printRaw: false,
            recursive: true,
            write: true,
            writeRaw: true
        }, Object(logOptions));
        if(!this.online) {
            if(logOverride.automaticOpen) this.open(logOverride);
            else throw new Error("Write stream is currently offline");
        };
        let raw = Object.assign({}, formatOptions, {
            dateTimeStyling: [],
            messageStyling: [],
            separatorStyling: [],
            titleStyling: []
        });
        this.emit("log", formatOptions, logOptions);
        if(logOverride.print) {
            this.emit("logPrint", formatOptions, logOptions);
            process.stdout.write(logOverride.printRaw ? this.format(raw) : this.format(formatOptions));
        };
        if(logOverride.write) {
            this.emit("logWrite", formatOptions, logOptions);
            this.stream.write(logOverride.writeRaw ? this.format(raw) : this.format(formatOptions))
        };
    };

    /**
     * Deletes the log file
     * @param {LogOptions} [options] Log options override
     * @returns {this} This
     */
    delete(options) {
        let override = Object.assign(this.options, Object(options));
        if(!this.exists) return this;
        if(this.online) {
            if(override.automaticClose) this.close(override);
            else throw new Error("Cannot delete the log while the write stream is online");
        };
        fs.unlinkSync(this.file);
        super.emit("delete");
        return this;
    };
    
    /**
     * Whether or not the file exists in the directory
     * @readonly
     * @returns {boolean} True if the file exists or false otherwise
     */
    get exists() {
        return fs.existsSync(this.file);
    };
    
    /**
     * File path
     * @readonly
     * @returns {string} File path
     */
    get file() {
        return this.#file;
    };
    
    /**
     * Modifies the file path
     * @param {string} file File path
     */
    set file(file) {
        this.#file = path.resolve(process.cwd(), file);
    };

    /**
     * Formatter
     * @readonly
     * @returns {Log.defaultFormatter | function} Formatter
     */
    get format() {
        return this.#formatter;
    };

    /**
     * Modifies the formatter
     * @param {function} formatter Formatter
     */
    set format(formatter) {
        if(typeof formatter !== "function") throw new TypeError("Formatter must be a type of function");
        this.#formatter = formatter.bind(this);
        this.#options.formatter = this.#formatter;
    };

    /**
     * Logger
     * @readonly
     * @returns {Log.defaultLogger | function} Logger
     */
    get log() {
        return this.#logger;
    };

    /**
     * Modifies the logger
     * @param {function} logger Logger
     */
    set log(logger) {
        if(typeof logger !== "function") throw new TypeError("Logger must be a type of function");
        this.#logger = logger.bind(this);
        this.#options.formatter = this.#logger;
    };
    
    /**
     * Whether or not the log stream is online
     * @readonly
     * @returns {boolean} True if the log stream is active or false otherwise
     */
    get online() {
        return !!this.stream && !this.stream.destroyed;
    };
    
    /**
     * Opens the write stream
     * @param {LogOptions} [options] Log options override
     * @returns {this} This
     */
    open(options = {}) {
        let override = Object.assign(this.options, Object(options));
        if(!this.exists) {
            if(options.automaticCreate) this.create(override);
            else throw new Error("Cannot open the write stream if the log file does not exist");
        };
        if(this.online) return this;
        super.emit("beforeOpen");
        this.#stream = fs.createWriteStream(this.file);
        this.#stream.on("ready", () => super.emit("open", this.#stream));
        return this;
    };

    /**
     * Log options
     * @readonly
     * @returns {LogOptions} Log options
     */
    get options() {
        return Object.assign({}, this.#options);
    };

    /**
     * Modifies the log options
     * @param {LogOptions} options Log options
     */
    set options(options) {
        if(!options || typeof options !== "object") throw new TypeError("Invalid options");
        let defaultOptions = [
            { key: "automaticClose", target: Boolean, value: true },
            { key: "automaticCreate", target: Boolean, value: true },
            { key: "automaticOpen", target: Boolean, value: true },
            { key: "formatter", target: Function, value: Log.defaultFormatter },
            { key: "logger", target: Function, value: Log.defaultLogger },
            { key: "recursive", target: Boolean, value: true },
        ], parsedOptions = {};
        for(let i = 0; i < defaultOptions.length; i++) {
            let { key, target, value } = defaultOptions[i];
            parsedOptions[key] = (key in options && options[key] instanceof target) ? options[key] : value;
        };
        this.#options = parsedOptions;
        this.#formatter = this.#options.formatter;
        this.#logger = this.#options.logger;
    };

    /**
     * Write stream of the log
     * @readonly
     * @returns {fs.WriteStream?} Write stream
     */
    get stream() {
        return this.#stream;
    };
};

// Exports
module.exports = Log;