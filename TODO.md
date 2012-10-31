### TODO

 * ~~Tidy up css: include leaflet-control-toolbar for common styles~~
 * ~~Rename _shapes variable in Control.Draw to make better sense.~~
 * ~~Should the ext classes be renamed to Polyline.Intersect or similar?~~
 * ~~Make Control.Draw inherit from Control.Toolbar.~~
 * ~~Rename Handler.Draw -> Vector.Draw. What about markers? they aren't vectors, is there a better name? Maybe Feature?~~
 * ~~Add enbled/disabled states for the delete & edit buttons.~~
 * ~~Move control/handler files out of draw folder.~~
 * ~~Rename the draw events from draw:feature t0 feature-created.~~
 * ~~Revert to the correct colour for the feature that was just deselected.~~
 * ~~Rename the Handler activated/deactivated events to enabled/disabled.~~
 * ~~Add option for setting the selected color.~~
 * ~~Check and calls to L.Feature.Draw.prototype, are they correct? In Draw.Circle it hink it should be referencing L.Draw.SimpleShape~~
 * ~~Add in cancel buttons for selected button.~~
 * ~~Have special behavior for selected markers. Do we just set the background color?~~

 * Do we need a better visual cue for when in selecting mode?
 * See if any common code can move to Control.Toolbar from Control.Draw.
 * Fix up the toolbar rounded corners when only 1 item in the toolbar.
 * Handle controls from being removed from map.
 * Should the Edit control disable when the user has pressed delete?
 * Turn the cancel button UI into a button container for things like undo.
 * Add support for tooltips for the edit mode.

 * Write up a breaking changes for when 0.2 goes live. (See below)
 * Add some proper documentation. I.e. for the events & methods
 * Update Deps. Maybe should make it more advanced to allow people to custom build without parts? Like edit only or draw only? Also file names ahve changed.

### Edit functionality

Need to add a new button that puts the selected shape in edit mode.

Some questions:

1. Currently the select tool will let the user select multiple objects. Is it OK to then set all selected shapes to edit mode?

### Breaking changes

 * activated & deactivated events renamed to enabled/disabled.
 * renamed css classes.
 * drawing & drawing-disabled events renamed to: draw:enabled & draw:disabled.