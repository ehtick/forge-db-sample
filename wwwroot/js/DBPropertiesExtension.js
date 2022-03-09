/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

// *******************************************
// DB Property Panel
// *******************************************
class DBPropertyPanel extends Autodesk.Viewing.Extensions.ViewerPropertyPanel {
  constructor(viewer, options) {
    super(viewer, options);
    this.properties = options.properties || {};
    //this.currentText = "";
    this.currentProperty = null;
    this.dbId = "";

    //This is the event for property doubleclick
    Autodesk.Viewing.UI.PropertyPanel.prototype.onPropertyDoubleClick = this.onPropertyDoubleClick;
    //This in the event for object selection changes
    viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, this.queryProps.bind(this));
  }

  queryProps(method) {
    //viewer.getProperties(viewer.getSelection(), data => method == 'update' ? this.updateDB(data) : this.queryDB(data));
    let selecteddbId = viewer.getSelection()[0];
    method === 'update' ? this.updateDB(selecteddbId) : this.queryDB(selecteddbId);
  }

  updateDB(selecteddbId) {
    //let externalId = data.externalId;
    //let projectId = selectedNode.projectId;
    let itemId = selectedNode.itemId;
    //externalId ? updateDBData(selecteddbId, this.currentProperty, itemId) : $("div.failure").fadeIn(500).delay(2000).fadeOut(500);
    updateDBData(selecteddbId, this.currentProperty, itemId)
    //this.sendChanges(data.externalId)
  }

  queryDB(selecteddbId) {
    //let externalId = data.externalId;
    //let projectId = selectedNode.projectId;
    let itemId = selectedNode.itemId;
    //externalId ? extractDBData(selecteddbId, itemId) : $("div.failure").fadeIn(500).delay(2000).fadeOut(500);
    extractDBData(selecteddbId, itemId);
  }

  setAggregatedProperties(propertySet) {
    Autodesk.Viewing.Extensions.ViewerPropertyPanel.prototype.setAggregatedProperties.call(this, propertySet);

    // add your custom properties here
    const dbids = propertySet.getDbIds();
    dbids.forEach(id => {
      this.setdbIdProperties(id);
    });
  }

  setdbIdProperties(dbId) {
    var propsForObject = this.properties[dbId.toString()];
    if (propsForObject) {
      for (const groupName in propsForObject) {
        const group = propsForObject[groupName];
        for (const propName in group) {
          const prop = group[propName];
          this.addProperty(propName, prop, groupName);
        }
      }
    }
  }

  async updateCurrentProperty(newValue) {
    this.properties[this.dbId][this.currentProperty.category][this.currentProperty.name] = newValue;
    try {
      this.removeProperty(this.currentProperty.name, this.currentProperty.value, this.currentProperty.category);
    }
    catch { }
    this.setdbIdProperties(this.dbId);
    //this.currentProperty.value = '"<input type="text">"';
    this.currentProperty.value = newValue;
  }

  onPropertyDoubleClick(property, event) {
    this.dbId = viewer.getSelection()[0];
    if (this.checkProperty(property)) {
      this.currentProperty = property;
      Swal.fire({
        title: `Type the new value for the property ${property.name}`,
        input: 'text',
        inputValue: property.value,
        inputAttributes: {
          autocapitalize: 'off'
        },
        showCancelButton: true,
        confirmButtonText: 'Update DB',
        showLoaderOnConfirm: true,
        allowOutsideClick: () => !Swal.isLoading()
      }).then((result) => {
        if (result.isConfirmed) {
          this.updateCurrentProperty(result.value);
          this.queryProps('update');
          console.log("Current property changed to " + property.name + " : " + property.value);
        }
      })
      
    }
    else {
      console.log("This property isn't vailable!");
    }
  }

  //onPropertyClick(property, event) {
  //  this.dbId = viewer.getSelection()[0];
  //  if (this.checkProperty(property)) {
  //    this.currentProperty = property;
  //    this.currentText = property.value;
  //    console.log("Current property changed to " + property.name + " : " + property.value);
  //  }
  //  else {
  //    console.log("This property isn't vailable!");
  //  }
  //}

  checkProperty(property) {
    try {
      //Here we check if the property selected is aquired from DB
      return this.properties[this.dbId][property.category][property.name] == property.value;
    }
    catch {
      return false;
    }
  }
};

//Here we show the user the result about the updated parameter
async function showUpdateResult(selecteddbId, updateResult) {
  //let dbId = idsMap[externalId];
  //viewer.isolate(dbId);
  let selector = (updateResult ? "div.ready" : "div.failure")
  $(selector).fadeIn(500).delay(2000).fadeOut(500);
}

async function showNotification(selecteddbId) {
  $('#alert_boxes').append(
    `<div class="alert-box updated" onclick="highlightDbId(event, ${selecteddbId})">${selecteddbId + ' updated!'}</div>`
  );
  setTimeout(() => {
    $('#alert_boxes').find(':last-child').fadeIn(500).delay(4000).fadeOut(500, function () { $(this).remove(); });
  }, 100);
}

async function highlightDbId(event, selecteddbId) {
  event.target.remove();
  viewer.isolate(selecteddbId);
  viewer.fitToView(selecteddbId);
}

//Here we add the properties aquired from DB to the proper dbid proper property panel
async function addProperties(selecteddbId, properties) {
  //let dbId = idsMap[externalId];
  let ext = viewer.getExtension('DBPropertiesExtension');

  ext.panel.properties[selecteddbId] = {
    "Properties From DB": {

    }
  };
  for (const property of Object.keys(properties)) {
    ext.panel.properties[selecteddbId]["Properties From DB"][property] = properties[property];
  }
  ext.panel.setdbIdProperties(selecteddbId);

  //showAddedProperty();
  $("div.ready").fadeIn(500).delay(1500).fadeOut(500);
}

async function showAddedProperty() {
  $('#alret_boxes').a
}

//Here we reach the server endpoint to update the proper data from DB
async function updateDBData(selecteddbId, property, itemId) {
  const requestUrl = '/api/dbconnector';
  const requestData = {
    'connectionId': connection.connection.connectionId,
    'dbProvider': $('#dboptions').find(":selected").text(),
    'property': property,
    'selecteddbId': selecteddbId,
    'itemId': itemId
  };
  apiClientAsync(requestUrl, requestData, 'post');
  $("div.gathering").fadeIn(500).delay(1500).fadeOut(500);
  alert("Changes sent to DB!");
}

//Here we reach the server endpoint to retrieve the proper data from DB
async function extractDBData(selecteddbId, itemId) {
  try {
    const requestUrl = '/api/dbconnector';
    const requestData = {
      'connectionId': connection.connection.connectionId,
      'selecteddbId': selecteddbId,
      'itemId': itemId,
      'dbProvider': $('#dboptions').find(":selected").text()
    };
    apiClientAsync(requestUrl, requestData);
    $("div.gathering").fadeIn(500).delay(2000).fadeOut(500);
  }
  catch (err) {
    console.log(err);
    $("div.failure").fadeIn(500).delay(2000).fadeOut(500);
  }
}

// helper function for Request
function apiClientAsync(requestUrl, requestData = null, requestMethod = 'get') {
  let def = $.Deferred();

  if (requestMethod == 'post') {
    requestData = JSON.stringify(requestData);
  }

  jQuery.ajax({
    url: requestUrl,
    contentType: 'application/json',
    type: requestMethod,
    dataType: 'json',
    data: requestData,
    success: function (res) {
      def.resolve(res);
    },
    error: function (err) {
      console.error('request failed:');
      def.reject(err)
    }
  });
  return def.promise();
}

// *******************************************
// DB Properties Extension
// *******************************************
class DBPropertiesExtension extends Autodesk.Viewing.Extension {
  constructor(viewer, options) {
    super(viewer, options);

    this.panel = new DBPropertyPanel(viewer, options);
  }

  async load() {
    var ext = await this.viewer.getExtension('Autodesk.PropertiesManager');
    ext.setPanel(this.panel);

    return true;
  }

  async unload() {
    var ext = await this.viewer.getExtension('Autodesk.PropertiesManager');
    ext.setDefaultPanel();

    return true;
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension('DBPropertiesExtension', DBPropertiesExtension);