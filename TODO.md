### TODO

 * Tidy up css: include leaflet-control-toolbar for common styles
 * Add in cancel buttons for selected button.
 * Do we need a better visual cue for when in selecting mode?
 * Make Control.Draw inherit from Control.Toolbar.
 * See if any common code can move to Control.Toolbar from Control.Draw.
 * ~~Rename Handler.Draw -> Vector.Draw. What about markers? they aren't vectors, is there a better name? Maybe Feature?~~
 * Add enbled/disabled states for the delete & edit buttons.
 * Update Deps. Maybe should make it more advanced to allow people to custom build without parts? Like edit only or draw only?

### Edit functionality

Need to add a new button that puts the selected shape in edit mode.

Some questions:

 # Currently the select tool will let the user select multiple objects. Is it OK to then set all selected shapes to edit mode?