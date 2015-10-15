FLOW.NavMapsView = FLOW.View.extend({
  templateName: 'navMaps/nav-maps-common',
  showDetailsBool: false,
  detailsPaneElements: null,
  detailsPaneVisible: null,
  map: null,
  marker: null,
  geoShape: null,
  geoshapeCoordinates: [],
  polygons: [],
  mapZoomLevel: 0,
  mapCenter: null,
  hierarchyObjectAncestors: 0,
  previousObjectAncestors: 0,
  hierarchyObject: [],
  geomodel: null,
  cartodbLayer: null,
  layerExistsCheck: false,

  init: function () {
    this._super();
    this.detailsPaneElements = "#pointDetails h2" +
      ", #pointDetails dl" +
      ", #pointDetails img" +
      ", #pointDetails .imgContainer" +
      ", .placeMarkBasicInfo" +
      ", .noDetails";
    this.detailsPaneVisible = false;
  },

  redoMap: function() {
      var n, e, s, w, mapBounds;
      mapBounds = this.map.getBounds();
      // get current bounding box of the visible map
      n = mapBounds.getNorthEast().lat;
      e = mapBounds.getNorthEast().lng;
      s = mapBounds.getSouthWest().lat;
      w = mapBounds.getSouthWest().lng;

      // bound east and west
      e = (e + 3 * 180.0) % (2 * 180.0) - 180.0;
      w = (w + 3 * 180.0) % (2 * 180.0) - 180.0;

      // create bounding box object
      var bb = this.geoModel.create_bounding_box(n, e, s, w);

      // create the best set of geocell box cells which covers
      // the current viewport
      var bestBB = this.geoModel.best_bbox_search_cells(bb);

      // adapt the points shown on the map
      FLOW.placemarkController.adaptMap(bestBB, this.map.getZoom());
    },

  /**
    Once the view is in the DOM create the map
  */
  didInsertElement: function () {
    var self = this;

    if (FLOW.Env.mapsProvider === 'cartodb') {
      self.insertCartodbMap();
    } else {
      if (FLOW.Env.mapsProvider === 'google') {
        self.insertGoogleMap();
      } else {
        self.insertMapboxMap();
      }
      // couple listener to end of zoom or drag
      this.map.on('moveend', function (e) {
        self.redoMap();
      });
      FLOW.placemarkController.set('map', this.map);
      this.geoModel = create_geomodel();
      //load points for the visible map
      this.redoMap();
    }

    // add scale indication to map
    L.control.scale({position:'topleft', maxWidth:150}).addTo(this.map);

    this.$('#mapDetailsHideShow').click(function () {
      self.handleShowHideDetails();
    });

    // Slide in detailspane after 1 sec
    this.hideDetailsPane(1000);
  },

  insertGoogleMap: function () {
    this.map = new L.Map('flowMap', {center: new L.LatLng(-0.703107, 36.765), zoom: 2});
    var roadmap = new L.Google("ROADMAP");
    var terrain = new L.Google('TERRAIN');
    var satellite = new L.Google('SATELLITE');
    this.map.addLayer(roadmap);
    this.map.addControl(new L.Control.Layers({
      'Roadmap': roadmap,
      'Satellite': satellite,
      'Terrain': terrain
    }, {}));
  },

  insertMapboxMap: function() {
    this.map = L.mapbox.map('flowMap', 'akvo.he30g8mm').setView([-0.703107, 36.765], 2);
    L.control.layers({
      'Terrain': L.mapbox.tileLayer('akvo.he30g8mm').addTo(this.map),
      'Streets': L.mapbox.tileLayer('akvo.he2pdjhk'),
      'Satellite': L.mapbox.tileLayer('akvo.he30neh4')
    }).addTo(this.map);
  },

  insertCartodbMap: function() {
    var self = this;
    var filterContent = '<div id="survey_hierarchy" style="float: left"></div>&nbsp;';

    $('#dropdown-holder').prepend(filterContent);
    $('#dropdown-holder').append('<div style="clear: both"></div>');

    //Define the data layer
    var data_layer;

    // create leaflet map
    var map = L.map('flowMap', {scrollWheelZoom: true}).setView([26.11598592533351, 1.9335937499999998], 2);

    var bounds = new L.LatLngBounds(map.getBounds().getSouthWest(), map.getBounds().getNorthEast());

    map.options.maxBoundsViscosity = 1.0;
    map.options.maxBounds = bounds;
    map.options.maxZoom = 18;
    map.options.minZoom = 2;

    var mbAttr = 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
			mbUrl = 'https://{s}.{base}.maps.cit.api.here.com/maptile/2.1/maptile/{mapID}/{scheme}/{z}/{x}/{y}/256/{format}?app_id={app_id}&app_code={app_code}';

    var normal = L.tileLayer(mbUrl, {
      scheme: 'normal.day.transit',
      format: 'png8',
      attribution: mbAttr,
      subdomains: '1234',
      mapID: 'newest',
      app_id: FLOW.Env.hereMapsAppId,
      app_code: FLOW.Env.hereMapsAppCode,
      base: 'base'
    }).addTo(map),
    satellite  = L.tileLayer(mbUrl, {
      scheme: 'hybrid.day',
      format: 'jpg',
      attribution: mbAttr,
      subdomains: '1234',
      mapID: 'newest',
      app_id: FLOW.Env.hereMapsAppId,
      app_code: FLOW.Env.hereMapsAppCode,
      base: 'aerial'
    });

    var baseLayers = {
			"Normal": normal,
			"Satellite": satellite
		};

    L.control.layers(baseLayers).addTo(map);

    this.map = map;

    map.on('click', function(e) {
      if(self.marker != null){
        self.map.removeLayer(self.marker);
        self.hideDetailsPane();
        $('#pointDetails').html('<p class="noDetails">'+Ember.String.loc('_no_details') +'</p>');
      }

      if(self.polygons.length > 0){
        for(var i=0; i<self.polygons.length; i++){
          self.map.removeLayer(self.polygons[i]);
        }
        //restore the previous zoom level and map center
        self.map.setZoom(self.mapZoomLevel);
        self.map.panTo(self.mapCenter);
        self.polygons = [];
      }
    });

    //manage folder and/or survey selection hierarchy
    self.checkHierarchy(0);

    $(document.body).on('change', '.folder_survey_selector', function(){
      $('#form_selector option[value!=""]').remove();

      //first remove previously created form selector elements
      $(".form_selector").remove();

      if($(this).val() !== ""){
        var keyId = $(this).val();
        //if a survey is selected, load forms to form selector element.
        if($(this).find("option:selected").data('type') === 'PROJECT'){
          $.get('/rest/cartodb/forms?surveyId='+keyId, function(data, status) {
            var rows = [];
            if(data['forms'] && data['forms'].length > 0) {
              rows = data['forms'];
              rows.sort(function(el1, el2) {
                return self.compare(el1, el2, 'name')
              });

              var hierarchyObject = self.hierarchyObject;
              for(var j=0; j<hierarchyObject.length; j++){
                if(hierarchyObject[j].keyId == keyId){
                  self.hierarchyObjectAncestors = hierarchyObject[j]['ancestorIds'].length;
                  self.cleanHierarchy();
                }
              }

              //create folder and/or survey select element
              var form_selector = $("<select></select>").attr("data-survey-id", keyId).attr("class", "form_selector");
              form_selector.append('<option value="">--' + Ember.String.loc('_choose_a_form') + '--</option>');

              for(var i=0; i<rows.length; i++) {
                //append returned forms list to the firm selector element
                form_selector.append(
                  $('<option></option>').val(rows[i]["id"]).html(rows[i]["name"]));
              }
              $("#survey_hierarchy").append(form_selector);
            }
          });

          var namedMapObject = {};
          namedMapObject['mapObject'] = map;
          namedMapObject['mapName'] = 'data_point_'+keyId;
          namedMapObject['tableName'] = 'data_point';
          namedMapObject['interactivity'] = ["name", "survey_id", "id", "identifier", "lat", "lon"];
          namedMapObject['query'] = 'SELECT * FROM data_point WHERE survey_id='+keyId;

          self.namedMapCheck(namedMapObject);
        }else{ //if a folder is selected, load the folder's children on a new 'folder_survey_selector'
          //first clear any currently overlayed cartodb layer (if any)
          self.clearCartodbLayer();

          var hierarchyObject = self.hierarchyObject;
          for(var i=0; i<hierarchyObject.length; i++){
            if(hierarchyObject[i].keyId == keyId){
              self.hierarchyObjectAncestors = hierarchyObject[i]['ancestorIds'].length;
              self.checkHierarchy(keyId);
            }
          }
        }
      }else{ //if nothing is selected, delete all children 'folder_survey_selector's and clear form selector
        self.clearCartodbLayer();

        //remove all 'folder_survey_selector's outside of ancestors count
        self.cleanHierarchy();
      }

    });

    $(document.body).on('change', '.form_selector', function(){
      if ($(this).val() !== "") {
        var formId = $(this).val();
        //get list of columns to be added to new named map's interactivity
        $.get("/rest/cartodb/columns?form_id="+formId, function(columnsData) {
          var namedMapObject = {};
          namedMapObject['mapObject'] = map;
          namedMapObject['mapName'] = "raw_data_"+formId;
          namedMapObject['tableName'] = "raw_data_"+formId;
          namedMapObject['interactivity'] = [];
          namedMapObject['query'] = "SELECT * FROM raw_data_" + formId;

          if (columnsData.column_names) {
            for (var j=0; j<columnsData['column_names'].length; j++) {
              namedMapObject['interactivity'].push(columnsData['column_names'][j]['column_name']);
            }
          }

          self.namedMapCheck(namedMapObject);
        });
      } else {
        self.createLayer(map, "data_point_"+$(this).data('survey-id'), "");
      }
    });

    $(document.body).on('click', '#projectGeoshape', function(){
      if(self.polygons.length > 0){
        $('#projectGeoshape').html(Ember.String.loc('_project_geoshape_onto_main_map'));
        for(var i=0; i<self.polygons.length; i++){
          self.map.removeLayer(self.polygons[i]);
        }
        //restore the previous zoom level and map center
        self.map.setZoom(self.mapZoomLevel);
        self.map.panTo(self.mapCenter);
        self.polygons = [];
      }else{
        $('#projectGeoshape').html(Ember.String.loc('_clear_geoshape_from_main_map'));
        if(self.geoshapeCoordinates.length > 0){
          self.projectGeoshape(self.geoshapeCoordinates);
        }
      }
    });
  },

  /*Check if a named map exists. If one exists, call function to overlay it
  else call function to create a new one*/
  namedMapCheck: function(namedMapObject){
    var self = this;
    $.get("/rest/cartodb/named_maps", function(data, status) {
      if (data.template_ids) {
        var mapExists = false;
        for (var i=0; i<data['template_ids'].length; i++) {
          if(data['template_ids'][i] === namedMapObject.mapName) {
            //named map already exists
            mapExists = true;
            break;
          }
        }

        if (mapExists) {
          //overlay named map
          self.createLayer(namedMapObject.mapObject, namedMapObject.mapName, "");
        }else{
          //create new named map
          self.namedMaps(
            namedMapObject.mapObject,
            namedMapObject.mapName,
            namedMapObject.tableName,
            namedMapObject.query,
            namedMapObject.interactivity);
        }
      }
    });
  },

  /**
    Helper function to dispatch to either hide or show details pane
  */
  handleShowHideDetails: function () {
    if (this.detailsPaneVisible) {
      this.hideDetailsPane();
    } else {
      this.showDetailsPane();
    }
  },

  /**
    Slide in the details pane
  */
  showDetailsPane: function () {
    var button;

    button = this.$('#mapDetailsHideShow');
    button.html('Hide &rsaquo;');
    this.set('detailsPaneVisible', true);

    this.$('#flowMap').animate({
      width: '75%'
    }, 200);
    this.$('#pointDetails').animate({
      width: '24.5%'
    }, 200).css({
      overflow: 'auto',
      marginLeft: '-2px'
    });
    this.$(this.detailsPaneElements, '#pointDetails').animate({
      opacity: '1'
    }, 200).css({
      display: 'inherit'
    });
  },


  /**
    Slide out details pane
  */
  hideDetailsPane: function (delay) {
    var button;

    delay = typeof delay !== 'undefined' ? delay : 0;
    button = this.$('#mapDetailsHideShow');

    this.set('detailsPaneVisible', false);
    button.html('&lsaquo; Show');

    this.$('#flowMap').delay(delay).animate({
      width: '99.25%'
    }, 200);
    this.$('#pointDetails').delay(delay).animate({
      width: '0.25%'
    }, 200).css({
      overflow: 'scroll-y',
      marginLeft: '-2px'
    });
    this.$(this.detailsPaneElements, '#pointDetails').delay(delay).animate({
      opacity: '0',
      display: 'none'
    });
  },

  /**
    If a placemark is selected and the details pane is hidden make sure to
    slide out
  */
  handlePlacemarkDetails: function () {
    var details;

    details = FLOW.placemarkDetailController.get('content');

    if (!this.detailsPaneVisible) {
      this.showDetailsPane();
    }
    if (!Ember.empty(details) && details.get('isLoaded')) {
      this.populateDetailsPane(details);
    }
  }.observes('FLOW.placemarkDetailController.content.isLoaded'),


  /**
    Populates the details pane with data from a placemark
  */
  populateDetailsPane: function (details) {
    var rawImagePath, verticalBars;

    this.set('showDetailsBool', true);
    details.forEach(function (item) {
      rawImagePath = item.get('stringValue');
      verticalBars = rawImagePath.split('|');
      if (verticalBars.length === 4) {
        FLOW.placemarkDetailController.set('selectedPointCode',
          verticalBars[3]);
      }
    }, this);
  },

  compare: function (el1, el2, index) {
    return el1[index] == el2[index] ? 0 : (el1[index] < el2[index] ? -1 : 1);
  },

  /*Place a marker to highlight clicked point of layer on cartodb map*/
  placeMarker: function(latlng){
    var markerIcon = new L.Icon({
      iconUrl: 'images/marker.svg',
      iconSize: [10, 10]
    });
    this.marker = new L.marker(latlng, {icon: markerIcon});
    this.map.addLayer(this.marker);
  },

  //create named maps
  namedMaps: function(map, mapName, table, sql, interactivity){
    var self = this;

    //style of points for new layer
    var cartocss = "#"+table+"{"
      +"marker-fill-opacity: 0.9;"
      +"marker-line-color: #FFF;"
      +"marker-line-width: 1.5;"
      +"marker-line-opacity: 1;"
      +"marker-placement: point;"
      +"marker-type: ellipse;"
      +"marker-width: 10;"
      +"marker-fill: #FF6600;"
      +"marker-allow-overlap: true;"
      +"}";

    var configJsonData = {};
    configJsonData['interactivity'] = interactivity;
    configJsonData['name'] = mapName;
    configJsonData['cartocss'] = cartocss;
    configJsonData['sql'] = sql;

    $.ajax({
      type: 'POST',
      contentType: "application/json",
      url: '/rest/cartodb/named_maps',
      data: JSON.stringify(configJsonData), //turns out you need to stringify the payload before sending it
      dataType: 'json',
      success: function(namedMapData){
        if(namedMapData.template_id){
          self.createLayer(map, mapName, "");
        }
      }
    });
  },

  /*this function overlays a named map on the cartodb map*/
  createLayer: function(map, mapName, interactivity){
    var self = this, pointDataUrl;

    //first clear any currently overlayed cartodb layer
    self.clearCartodbLayer();

    // add cartodb layer with one sublayer
    cartodb.createLayer(map, {
      user_name: FLOW.Env.appId,
      type: 'namedmap',
      named_map: {
        name: mapName,
        layers: [{
          layer_name: "t",
          interactivity: "id"
        }]
      }
    },{
      tiler_domain: FLOW.Env.cartodbHost,
      tiler_port: "", //set to empty string to stop cartodb js from appending default port
      tiler_protocol: "https",
      no_cdn: true
    })
    .addTo(map)
    .done(function(layer) {
      layer.setZIndex(1000); //required to ensure that the cartodb layer is not obscured by the here maps base layers
      self.layerExistsCheck = true;
      self.cartodbLayer = layer;

      self.addCursorInteraction(layer);

      var current_layer = layer.getSubLayer(0);
      current_layer.setInteraction(true);

      current_layer.on('featureClick', function(e, latlng, pos, data) {
        if(self.marker != null){
          self.map.removeLayer(self.marker);
        }
        self.placeMarker([data.lat, data.lon]);

        self.showDetailsPane();
        if($('.form_selector').length && $('.form_selector').val() !== ""){
          pointDataUrl = '/rest/cartodb/raw_data?dataPointId='+data.data_point_id+'&formId='+$('.form_selector').val();
          $.get('/rest/cartodb/data_point?id='+data.data_point_id, function(pointData, status){
            self.getCartodbPointData(pointDataUrl, pointData['row']['name'], pointData['row']['identifier']);
          });
        }else{
          pointDataUrl = '/rest/cartodb/answers?dataPointId='+data.id+'&surveyId='+data.survey_id;
          self.getCartodbPointData(pointDataUrl, data.name, data.identifier);
        }
      });
    });
  },

  /*function is required to manage how the cursor appears on the cartodb map canvas*/
  addCursorInteraction: function (layer) {
    var hovers = [];

    layer.bind('featureOver', function(e, latlon, pxPos, data, layer) {
      hovers[layer] = 1;
      if(_.any(hovers)) {
        $('#flowMap').css('cursor', 'pointer');
      }
    });

    layer.bind('featureOut', function(m, layer) {
      hovers[layer] = 0;
      if(!_.any(hovers)) {
        $('#flowMap').css({"cursor":"-moz-grab","cursor":"-webkit-grab"});
      }
    });
  },

  getCartodbPointData: function(url, dataPointName, dataPointIdentifier){
    var self = this;
    $("#pointDetails").html("");
    $.get(url, function(pointData, status){
      var clickedPointContent = "";

      if (pointData['answers'] != null) {
        //get request for questions
        $.get(
            "/rest/cartodb/questions?form_id="+pointData['formId'],
            function(questionsData, status){
              var geoshapeCheck = false;
              self.geoshapeCoordinates = [];

              var dataCollectionDate = pointData['answers']['created_at'];
              var date = new Date(dataCollectionDate);

              clickedPointContent += '<ul class="placeMarkBasicInfo floats-in">'
              +'<h3>'
              +((dataPointName != "" && dataPointName != "null" && dataPointName != null) ? dataPointName : "")
              +'</h3>'
              +'<li>'
              +'<span>'+Ember.String.loc('_data_point_id') +':</span>'
              +'<div style="display: inline; margin: 0 0 0 5px;">'+dataPointIdentifier+'</div>'
              +'</li>'
              +'<li>'
              +'<span>'+Ember.String.loc('_collected_on') +':</span>'
              +'<div class="placeMarkCollectionDate">'
              +date.toUTCString()
              +'</div></li><li></li></ul>';

              clickedPointContent += '<div class="mapInfoDetail" style="opacity: 1; display: inherit;">';
              for (column in pointData['answers']){
                for(var i=0; i<questionsData['questions'].length; i++){
                  if (column.match(questionsData['questions'][i].id)) {
                    if(questionsData['questions'][i].type == "GEOSHAPE"){
                      clickedPointContent += '<h4><div style="float: left">'
                      +questionsData['questions'][i].display_text
                      +'</div>&nbsp;<a style="float: right" id="projectGeoshape">'+Ember.String.loc('_project_geoshape_onto_main_map') +'</a></h4>';
                    }else{
                      clickedPointContent += '<h4>'+questionsData['questions'][i].display_text+'&nbsp;</h4>';
                    }

                    clickedPointContent += '<div style="float: left; width: 100%">';

                    //if question is of type, photo load a html image element
                    if(questionsData['questions'][i].type == "PHOTO"){
                      var image = '<div class=":imgContainer photoUrl:shown:hidden">';
                      if(pointData['answers'][column] != null){
                        var image_filename = FLOW.Env.photo_url_root+pointData['answers'][column].substring(pointData['answers'][column].lastIndexOf("/")+1);
                        image += '<a href="'+image_filename+'" target="_blank">'
                        +'<img src="'+image_filename+'" alt=""/></a>';
                      }
                      image +'</div>';
                      clickedPointContent += image;
                    }else{
                      //if point is a geoshape, draw the shape in the side window
                      if(questionsData['questions'][i].type == "GEOSHAPE"){
                        if(pointData['answers'][column] !== "" && pointData['answers'][column] !== null && pointData['answers'][column] !== "null"){
                          clickedPointContent += '<div id="geoShapeMap" style="width:100%; height: 100px; float: left"></div>';
                          geoshapeCheck = true;
                          geoshapeObject = JSON.parse(pointData['answers'][column]);
                          if(geoshapeObject['features'].length > 0){
                            var geoshapeCoordinatesArray = geoshapeObject['features'][0]['geometry']['coordinates'][0];
                            for(var j=0; j<geoshapeCoordinatesArray.length; j++){
                              self.geoshapeCoordinates.push([geoshapeCoordinatesArray[j][1], geoshapeCoordinatesArray[j][0]]);
                            }

                            clickedPointContent += '<div style="float: left; width: 100%">Points: '+geoshapeObject['features'][0]['properties']['pointCount']+'</div>';
                            clickedPointContent += '<div style="float: left; width: 100%">Length: '+geoshapeObject['features'][0]['properties']['length']+'m</div>';
                            clickedPointContent += '<div style="float: left; width: 100%">Area: '+geoshapeObject['features'][0]['properties']['area']+'m&sup2;</div>';
                          }
                        }
                      }else{
                        clickedPointContent += pointData['answers'][column];
                      }
                    }
                    clickedPointContent += "&nbsp;</div><hr>";
                  }
                }
              }
              clickedPointContent += '</div>';
              $('#pointDetails').html(clickedPointContent);
              $('hr').show();

              //if there's geoshape, draw it
              if(geoshapeCheck){
                self.createGeoshape(self.geoshapeCoordinates);
              }
            });
      } else {
        clickedPointContent += '<p class="noDetails">'+Ember.String.loc('_no_details') +'</p>';
        $('#pointDetails').html(clickedPointContent);
      }
    });
  },

  createGeoshape: function(points){
    var getCentroid = function (arr) {
      return arr.reduce(function (x,y) {
        return [x[0] + y[0]/arr.length, x[1] + y[1]/arr.length]
      }, [0,0])
    }

    var center = getCentroid(points);

    var geoshapeMap = L.map('geoShapeMap', {scrollWheelZoom: false}).setView(center, 2);
    L.tileLayer('https://{s}.{base}.maps.cit.api.here.com/maptile/2.1/maptile/{mapID}/normal.day.transit/{z}/{x}/{y}/256/png8?app_id={app_id}&app_code={app_code}', {
      attribution: '<a href="http://developer.here.com">HERE</a>',
      subdomains: '1234',
      mapID: 'newest',
      app_id: FLOW.Env.hereMapsAppId,
      app_code: FLOW.Env.hereMapsAppCode,
      base: 'base',
      maxZoom: 18
    }).addTo(geoshapeMap);

    this.geoShape = L.polygon(points);
    this.geoShape.addTo(geoshapeMap);

    var southWest = this.geoShape.getBounds().getSouthWest();
    var northEast = this.geoShape.getBounds().getNorthEast();
    var bounds = new L.LatLngBounds(southWest, northEast);

    geoshapeMap.fitBounds(bounds);
  },

  //function to project geoshape from details panel to main map canvas
  projectGeoshape: function(coordinates){
    var geoShape = L.polygon(coordinates);
    this.polygons.push(geoShape);
    geoShape.addTo(this.map);

    var southWest = geoShape.getBounds().getSouthWest();
    var northEast = geoShape.getBounds().getNorthEast();
    var bounds = new L.LatLngBounds(southWest, northEast);

    //before fitting the geoshape to map, get the current
    //zoom level and map center first and save them
    this.mapZoomLevel = this.map.getZoom();
    this.mapCenter = this.map.getCenter();

    this.map.fitBounds(bounds);
  },

  checkHierarchy: function(parentFolderId){
    var self = this;

    //if survey hierarchy object has previously been retrieved, no need to pull it anew
    if(self.hierarchyObject.length > 0){
      self.manageHierarchy(parentFolderId);
    }else{
      $.get('/rest/survey_groups'/*place survey_groups endpoint here*/
      , function(data, status){
        if(data['survey_groups'].length > 0){
          self.hierarchyObject = data['survey_groups'];
          self.manageHierarchy(parentFolderId);
        }
      });
    }
  },

  manageHierarchy: function(parentFolderId){
    var self = this;

    rows = self.hierarchyObject;
    rows.sort(function(el1, el2) {
      return self.compare(el1, el2, 'name');
    });

    self.cleanHierarchy();

    //create folder and/or survey select element
    var folder_survey_selector = $("<select></select>").attr("id", "folder_survey_selector_"+self.hierarchyObjectAncestors).attr("class", "folder_survey_selector");
    folder_survey_selector.append('<option value="">--' + Ember.String.loc('_choose_folder_or_survey') + '--</option>');

    self.previousObjectAncestors = self.hierarchyObjectAncestors;

    for (var i=0; i<rows.length; i++) {
      //append return survey list to the survey selector element
      var surveyGroup = rows[i];

      //if a subfolder, only load folders and surveys from parent folder
      if(surveyGroup.parentId == parentFolderId){
        folder_survey_selector.append('<option value="'
          + surveyGroup.keyId + '"'
          +'data-type="'+surveyGroup.projectType+'">'
          + surveyGroup.name
          + '</option>');
      }
    }
    $("#survey_hierarchy").append(folder_survey_selector);
  },

  cleanHierarchy: function(){
    var self = this;

    if(self.hierarchyObjectAncestors <= self.previousObjectAncestors){
      for(var i=self.hierarchyObjectAncestors; i<=self.previousObjectAncestors; i++){
        $("#folder_survey_selector_"+i).remove();
      }
    }
  },

  clearCartodbLayer: function(){
    //check to confirm that there are no layers displayed on the map
    if(this.layerExistsCheck){
      this.map.removeLayer(this.cartodbLayer);
      this.layerExistsCheck = false;
    }
  }
});


FLOW.countryView = FLOW.View.extend({});
FLOW.PlacemarkDetailView = Ember.View.extend({});
FLOW.PlacemarkDetailPhotoView = Ember.View.extend({});
