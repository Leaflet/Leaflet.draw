# Customizable texts in Leaflet.draw and Leaflet.Illustrate and compatibility with each other 


These modified versions of Leaflet.Draw 0.2.4 and Leaflet.Illustrate 0.0.1 lets you integrate them whitout interfering each other. The way this works is that every time you click a control the remaining controls are disabled thus two controls can't be activated at the same time  

In adition there is a cancel button added to the textbox control and new variables that let you easily change the title and text controls 


## Index

* [First steps: Adding controls](#FirstStep)
* [Customize titles](#Titles)
* [Customize tooltips](#Tooltips)
* [Customize edit and remove controls](#EditRemove)
* [New variables added](#ListOfVariables)

<a name="FirstStep">
### First step: Addign drawing control and textbox control
</a>
First you need leaflet to create a L.map object and a L.FeatureGroup object and add it to the L.map object. Then you need to create a L.Control.Draw object and a L.Illustrate.Control object. 

Once you created BOTH Object you need to assign the L.Control.Draw Object to a new L.Illustrate.Control property called secondToolbar. You'll also need to assign the L.Illustrate.Control Object to another new L.Control.Draw property called illustrateToolbar. This will allow that every time you click a control the remaining controls get disabled whether it is a draw control or an illustrate control.

All these steps are shown in the next example:

```html
<html>
    <head>
        <meta name="description" content="Student's personalized learning maps">
        <meta name="keywords" content="maps, education, jquery, leaflet, geography">
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
     
        <link rel="stylesheet" href="css/leaflet.css">
        <script src="js/leaflet.js"></script>
        <!-- Add Leaflet-draw plugin -->
        <link rel="stylesheet" href="css/leaflet.draw.css">
        <script src="js/leaflet-draw-dev.js"></script>
        <!-- Add Leaflet-illustrate plugin -->
        <link rel="stylesheet" href="css/Leaflet.Illustrate.css">
        <script src="js/Leaflet.Illustrate.js"></script>
    </head>
    <body>
        <div id="mapid" style="width: 600px; height: 400px; position: relative; outline: none;" ></div>
        
        <script>

          // Creates a L.map object
          var mymap = L.map('mapid').setView([51.505, -0.09], 13);

          // Set a tileLayer to mymap 
          L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?                 access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
              maxZoom: 18,
              attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
                  '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                  'Imagery © <a href="http://mapbox.com">Mapbox</a>',
              id: 'mapbox.streets'
          }).addTo(mymap);

          // Creates a layer group and adds it to mymap variable
          var drawnItems = new L.FeatureGroup();
          mymap.addLayer(drawnItems);

          // Creates an Illustrate Object for a textbox control 
          var illustrateControl = new L.Illustrate.Control({});

          // Creates an Control.Draw Object for drawing controls
          var drawControl = new L.Control.Draw({});

          // This function adds a layer with the drawing created with the drawing controls
          mymap.on('draw:created', function (e) {
              var type = e.layerType,
              layer = e.layer;
              drawnItems.addLayer(layer);
          });

          // Asigns the drawControl Object as a property to the illustrateControl Object and vice versa
          illustrateControl.secondToolbar = drawControl;
          drawControl.illustrateToolbar = illustrateControl;

          // Adds both controls to mymap object 
          mymap.addControl(illustrateControl);

          mymap.addControl(drawControl);

        </script>
    </body>
</html>

```

<a name="Titles" >
### Next step: Customize titles and controls text 
 </a>
Next example will show you how you can create the L.Illustrate.Control and L.Control.Draw objects with customized titles. Inside each constructor you can pass an object called draw. Just follow the structure of this object that is shown in the example  or click [here](#ListOfVariables) to see all the properties of this object that you can customize.
```javascript
// Creates an Illustrate Object for a textbox control 
        var illustrateControl = new L.Illustrate.Control({
            // Customize textbox title and button title
            draw: {
                textbox: {
                    textboxTooltipEnd: "Presioná y luego arrastrá para dibujar un rectángulo de texto"
                },
                illustrate: {
                    cancelTxt: "Cancelar",
                    cancelTitleTxt: "Cancelar rectángulo de texto",
                    textboxTitle: "Agregá texto"
                },
            }
        });
                            
        // Creates an Control.Draw Object for drawing controls
        var drawControl = new L.Control.Draw({
            // Customize draw buttons title
            draw: {
                illustrateToolbar: {},
                position: 'topleft',
                polygon: {
                    title: "Dibujá polígonos",
                },
                polyline: {
                    title: "Dibujá líneas",
                },
                rectangle: {
                    title: "Dibujá rectángulos",
                },
                circle: {
                    title: "Dibujá círculos",
                },
                marker: {
                    title: "Insertá marcadores",
                }
            }
        });
```
<a name="Tooltips">
### Next Step: Customize controls tooltip:
</a>
If you want to customize the drawing controls tooltip you'll have to pass the same draw object with aditional variables. Inside this object, just write what control of the control you want to customize and the desired text (list of text you can customize is [here](#ListOfVariables))

```javascript
// Creates an Control.Draw Object for drawing controls
var drawControl = new L.Control.Draw({
    // Customize draw buttons tooltip that appear after you start drawing
    draw: {
        illustrateToolbar: {},
        position: 'topleft',
        polygon: {
            allowIntersection: false,
            polygonTooltipStart: "Clickeá y comenzá a dibujar polígonos",
            polygonTooltipCont: "Clickeá para continuar dibujando el polígono",
            polygonTooltipEnd: "Clickeá en el primer punto para terminar el polígono",
            polygonTooltipError: "<strong>Error:</strong> Los bordes de la figura no se pueden cruzar!",
        },
        polyline: {
            polylineTooltipStart: "Clickeá para comenzar a dibujar",
            polylineTooltipCont: "Presioná el botón izquierdo y terminá el segmento",
            polylineTooltipEnd: "Clickeá en el último punto para finalizar el dibujo",
        },
        rectangle: {
            rectangleTooltipEnd: "Clickeá y arrastrá para dibujar rectángulos",
            tooltipEnd: "Soltá el botón del mouse para terminar de dibujar" 
        },
        circle: {
            circleTooltipStart: "Clickeá y arrastrá para dibujar círculos",
            tooltipEnd: "Soltá el botón del mouse para terminar de dibujar",
        },
        marker: {
            markerTooltipStart: "Clickeá para insertar marcadores"
        },
        // These variables lets you customize the text and title of the polyline and polygone buttons 
        draw: {
            toolbar_undo_text: "Borrá el último punto",
            toolbar_undo_title: "Borrá el último punto",
            toolbar_actions_text: "Cancelar",
            toolbar_actions_title: "Cancelar dibujo",
        },
    }
});
```
<a name="EditRemove">
### Next step: Customize edit and remove controls
</a>
You can also customize the text related to the edit and remove button. In this case you need to pass an object called edit and inside this object you have to state what text you want to be shown. Remember that as always if you don't set any of these variables a default one will be provided.

```javascript
var drawControl = new L.Control.Draw({
    draw: {
        position: 'topleft',
    },
    // Customize edit and remove buttons title and text
    edit: {
        featureGroup: drawnItems, // this line will add both edit and remove controlls  
        // Buttons title
        editTxt: "Editá tus objetos",
        removeTxt: "Eliminá objetos",
        // Buttons title when there isn't any drawing
        editDisabledTxt: "No hay objetos para editar",
        removeDisabledTxt: "No hay objetos para borrar",
        // Tooltip when the remove button is clicked
        deleteTxt: "Hacé click en el objeto que desees eliminar",
        // Tooltips when the edit buttons is clicked
        editShapeTxt:"Arrastrá las esquinas o los centros de los objetos para editarlos",
        editShapeSubtextTxt: "Clickeá en cancelar para que no se apliquen los cambios",  
        // title and text of the save and cancel buttons
        saveTxt: "Guardar",
        saveTitleTxt: "Guardar cambios",
        cancelTxt: "Cancelar",
        cancelTitleTxt: "Cancelar la edición, eliminar los cambios",
    }
});
```
<a name="ListOfVariables" >
## List of customizabled texts
</a>
All these variables must be inside an object called draw that is passed to the constructor of the L.Control.Draw and the L.Illustrate.Control clases. If any of these is not set a default text will be provided for each one of these variables

### L.Illustrate.Control:

- draw.textbox.textboxTooltipEnd: Set the tooltip of the textbox button
- draw.illustrate.textboxTitle: Set the title of the textbox button
- draw.illustrate.cancelTxt: Set the text of the cancel button of the textbox button
- draw.illustrate.cancelTitleTxt: Set the title of the cancel button tof the textbox button


### L.Control.Draw: 

- draw.polygon.title: Set polygon buton title
- draw.polygon.polygonTooltipStart: Set tooltip text before first click.
- draw.polygon.polygonTooltipCont: Set tooltip text after first click. 
- draw.polygon.polygonTooltipEnd: Set tooltip text after second click and this will keep showing until the draw is finalized .
- draw.polygon.polygonTooltipError: Set tooltip text for when a line cross another line.


- draw.polyline.title: Sset polyline buton title
- draw.polyline.polylineTooltipStart: Set tooltip text before first click.
- draw.polyline.polylineTooltipCont: Set tooltip text after first click. 
- draw.polyline.polylineTooltipEnd: Set tooltip text after second click and this will keep showing until the draw is finalized .


- draw.rectangle.title: Set rectangle buton title 
- draw.rectangle.rectangleTooltipEnd: Set tooltip text before first click.
- draw.rectangle.tooltipEnd: Set tooltip text that is showed until you mouse up.

- draw.circle.title: Set circle buton title
- draw.circle.circleTooltipStart: Set tooltip text before first click.
- draw.circle.tooltipEnd: Set tooltip text that is showed until you mouse up. 
- draw.circle.radius: Set what word will be next to the radius of the circle when it's been created


- draw.marker.title: Set marker buton title
- draw.marker.markerTooltipStart: Set tooltip text before clicking and setting the location of the marker.


- draw.draw.toolbar_undo_text: Set text of the 'delete last point' button of the polyline and poligon control
- draw.draw.toolbar_undo_title: Set title of the 'delete last point' button of the polyline and poligon control
- draw.draw.toolbar_actions_text: Set text of the 'cancel' button of all the controls
- draw.draw.toolbar_actions_title: Set title of the 'cancel' button of all the controls


In case you want to customize text related to the edit and remove button you'll need to pass another object called edit inside the L.Control.Draw contructor only: 


- edit.editTxt: Set title of the edit button when there is at least one drawing
- edit.editDisabledTxt: Set title of the edit button when there is no drawing
- edit.removeTxt: Set title of the remove button when there is at least one drawing
- edit.removeDisabledTxt: Set title of the remove button when there is no drawing
- edit.deleteTxt: Set tooltip text after clicking on the remove button
- edit.editShapeTxt: Set first tooltip text after clicking on the edit button
- edit.editShapeSubtextTxt: Set Second tooltip text after clicking on the edit button
- edit.saveTxt: Set the save button text
- edit.saveTitleTxt: Set the save button title
- edit.cancelTxt: Set the cancel button text
- edit.cancelTitleTxt: Set the cancel title 
