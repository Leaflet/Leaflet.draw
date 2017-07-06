L.Draw.StateHandler = L.Class.extend({
	options: {
		'maxStackSize': 20, // set to -1 for infinite
		'undoKey': 'ctrl+z',
		'redoKey': 'ctrl+y'
	},

	initialize: function (map, undoAction, redoAction, options) {
		L.setOptions(this, options);

		this._map = map;
		this.undoAction = undoAction || null;
		this.redoAction = redoAction || null;
		this._enabled = false;

		this.enable();
	},

	enabled: function () {
		return this._enabled;
	},

	enable: function () {
		if (this._enabled) {
			return;
		}

		this._idCounter = 0;

		this.stateLock = false;
		this.stateTodo = [];

		this.undoStack = [];
		this.redoStack = [];

		if (this.undoAction !== null) {
			this._map.on(L.Draw.Event.UNDOACTION, this.undoAction, this);
		}

		if (this.redoAction !== null) {
			this._map.on(L.Draw.Event.REDOACTION, this.redoAction, this);
		}

		this.keyChecker = {};
		if (this.options.undoKey !== null) {
			this.bindKey(this.options.undoKey, this.undo);
		}

		if (this.options.redoKey !== null) {
			this.bindKey(this.options.redoKey, this.redo);
		}

		this._enabled = true;
	},

	disable: function () {
		if (!this._enabled) {
			return;
		}

		if (this.undoAction !== null) {
			this.map.off(L.Draw.Event.UNDOACTION, this.undoAction, this);
		}

		if (this.redoAction !== null) {
			this.map.off(L.Draw.Event.REDOACTION, this.redoAction, this);
		}

		if (this.options.undoKey !== null) {
			this.unbindKey(this.options.undoKey, this.undo);
		}

		if (this.options.redoKey !== null) {
			this.unbindKey(this.options.redoKey, this.redo);
		}

		this._enabled = false;
	},

	bindKey: function (key, action) {
		var checkCtl = (key.indexOf('ctrl') > -1);
		var checkedKey = (checkCtl) ? key.substr(-1) : key;
		checkedKey = checkedKey.toLowerCase();

		var that = this;
		this.keyChecker[key] = function (e) {
			var sameKey = (e.key.toLowerCase() === checkedKey);
			var sameCodeKey = (e.code.substr(-1).toLowerCase() === checkedKey);
			var ctlMatch = (e.ctrlKey || (!checkCtl));
			if ((sameKey || sameCodeKey) && ctlMatch) {
				e.preventDefault();
				e.stopPropagation();
				action.call(that);
				return false;
			}
		};

		L.DomEvent.on(document, 'keyup', this.keyChecker[key], this);
	},

	unbindKey: function (key) {
		L.DomEvent.off(document, 'keyup', this.keyChecker[key], this);
		delete this.keyChecker[key];
	},

	clear: function () {
		this.undoStack = [];
		this.redoStack = [];
	},

	discardLastPush: function () {
		this.undoStack.pop();
	},

	clearNested: function (numTimes) {
		this.redoStack = [];
		for (var i = 0; i < numTimes; i++) {
			this.undoStack.pop();
		}
	},

	pushUndo: function (moduleId, actionType, params, tag) {
		var stackItem = {
			'tag': tag || '',
			'actionType': actionType,
			'params': params,
			'undoId': this._idCounter,
			'moduleId': moduleId
		};

		this.undoStack.push(stackItem);
		this._map.fire(L.Draw.Event.PUSHUNDO, stackItem);
		this._idCounter++;

		if ((this.undoStack.length > this.options.maxStackSize) && (this.options.maxStackSize != -1)) {
			this.undoStack.shift();
		}
	},
	undo: function () {
		this.stateTodo.push('undo');

		if (this.stateLock) {
			return;
		}

		this.stateLock = true;
		this.processState();
	},

	putbackLastUndo: function () {
		var lastAction = this.redoStack.pop();
		this.undoStack.push(lastAction);
	},

	redo: function () {
		this.stateTodo.push('redo');

		if (this.stateLock) {
			return;
		}

		this.stateLock = true;
		this.processState();
	},

	// in the original version of this class, it was possible to trigger some sort of deep recursion error if ctrlZ/ctrlY were smashed very quickly.
	// my best conclusion as to why this occured was that some browsers seem to detect keyboard events in a seperate thread, and thus a race condition
	// could potentially develop from fast key input. thus, instead of executing the undo/redo action directly from the request, we debounce it via
	// triggering the undo/redos in a priority queue in order to ensure we only ever process one at a time.
	processState: function () {
		if (this.stateTodo.length === 0) {
			// only set false at the base case, as setTimeout actually returns immediately
			this.stateLock = false;
			return;
		}

		var nextAction = this.stateTodo.shift();
		var lastAction;

		if (nextAction === 'redo') {
			if (this.redoStack.length > 0) {
				lastAction = this.redoStack.pop();
				this.undoStack.push(lastAction);
				this._map.fire(L.Draw.Event.REDOACTION, lastAction);
			}
		}
		else {
			if (this.undoStack.length > 0) {
				lastAction = this.undoStack.pop();
				this.redoStack.push(lastAction);
				this._map.fire(L.Draw.Event.UNDOACTION, lastAction);
			}
		}

		// add a small amount of waiting time, 100ms should be fine - the error I saw when smashing ctrlZ/ctrlY very
		// quickly might actually be related to the display lagging behind the processing... it's hard to determine.
		// note that L.Draw uses setTimeout internally to handle error processing.
		// anyways, the user shouldn't notice 100ms of delay, so why not be safe than sorry?
		var that = this;
		setTimeout(function () {
			that.processState();
		}, 100);
	},
});