L.Draw.StateHandler =  L.Class.extend({
	options: {
		maxStackSize: 20, // set to -1 for infinite
		undoKey: 'ctrl+z',
		redoKey: 'ctrl+y'
	},
    
    initialize: function (map, undoAction, redoAction, options) {
        L.setOptions(this, options);
        
        this._map = map;
        this.undoAction = undoAction;
        this.redoAction = redoAction;
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
        
        this._enabled = true;
        this._idCounter = 0;
    
        this.stateLock = false;
        this.stateTodo = [];
        
        this.undoStack = [];
        this.redoStack = [];
        
        if (this.undoAction != null) {
            this._map.on('undoaction', this.undoAction, this);
        }
        
        if (this.redoAction != null) {
            this._map.on('redoaction', this.redoAction, this);
        }
        
        this.keyChecker = {};
        if (this.options.undoKey != null) {
            this.bindKey(this.options.undoKey, this.undo);
        }
        
        if (this.options.redoKey != null) {
            this.bindKey(this.options.redoKey, this.redo);
        }
    },
    
    disable: function () {
        if (! this._enabled) {
            return;
        }
        this._enabled = false;
        
        if (this.undoAction != null) {
            this.map.off('undoaction', this.undoAction, this);
        }
        
        if (this.redoAction != null) {
            this.map.off('redoaction', this.redoAction, this);
        }
        
        if (this.options.undoKey != null) {
            this.unbindKey(this.options.undoKey, this.undo);
        }
        
        if (this.options.redoKey != null) {
            this.unbindKey(this.options.redoKey, this.redo);
        }
    },
    
    bindKey: function (key, action) {
        var checkCtl = (key.indexOf('ctrl') > -1);
        var checkedKey = (checkCtl) ? key.substr(-1): key;
        checkedKey = checkedKey.toLowerCase();

        this.keyChecker[key] = function (e) {
            if (((e.key.toLowerCase() === checkedKey) || (e.code.substr(-1).toLowerCase() === checkedKey))
                && (e.ctrlKey || (!checkCtl))) {
                e.preventDefault();
                e.stopPropagation();
                action.call(this);
            }
        };
       
        L.DomEvent.on(document, 'keyup', this.keyChecker[key], this);
    },
    
    unbindKey: function (key) {
        L.DomEvent.off(document, 'keyup', this.keyChecker[key], this);
        delete this.keyChecker[key];
    },

    clear: function () {
        this.undoStack = new Array();
        this.redoStack = new Array();
    },
    
    discardLastPush: function () {
        this.undoStack.pop();
    },
        
    clearNested: function (numTimes) {
        this.redoStack = new Array();
        for (var i=0; i<numTimes; i++) {
            this.undoStack.pop();
        }
    },
        
    pushUndo: function (actionType, params) {
        this.undoStack.push({
            'actionType': actionType,
            'params': params,
            'undoId': this._idCounter
        });
        
        this._idCounter ++;
        
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
    // could potentially develop from fast key input. thus, instead of executing the undo/redo action directly from the request, we instead add the
    // triggered undo/redos into a priority queue in order to ensure we only ever process one at a time.
    processState: function () {
        if (this.stateTodo.length == 0) {
            // only set false at the base case, as setTimeout actually returns immediately
            this.stateLock = false;
            return;
        }
        var nextAction = this.stateTodo.shift();
    
        if (nextAction == 'redo') {
            if (this.redoStack.length > 0) {
                var lastAction = this.redoStack.pop();
                this.undoStack.push(lastAction);
                this._map.fire('redoaction', lastAction);
            }
        }
        else {
            if (this.undoStack.length > 0) {
                var lastAction = this.undoStack.pop();
                this.redoStack.push(lastAction);
                this._map.fire('undoaction', lastAction);
            }
        }
        
        // add a small amount of waiting time, 100ms should be fine - the error I saw when smashing ctrlZ/ctrlY very
        // quickly might actually be related to the display lagging behind the processing... it's hard to determine.
        // note that L.Draw uses setTimeout internally to handle error processing.
        // anyways, the user shouldn't notice 100ms of delay, so why not be safe than sorry?
        var that = this;
        setTimeout(function () { that.processState() }, 100);
    },
});