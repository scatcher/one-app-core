---
layout: "docs_api"
version: ""
versionHref: ""
path: "api/service/dataService/"

title: "dataService"
header_sub_title: "Service in module scripts"
doc: "dataService"
docType: "service"
---

<div class="improve-docs">
  <a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/data_srvc.js#L3'>
    View Me
  </a>
</div>
<div class="improve-docs">
  <a href='http://github.com/scatcher/sp-angular/edit/master/app/scripts/services/data_srvc.js#L3'>
    Edit Me
  </a>
</div>





<h1 class="api-title">

  dataService



</h1>





Handles all interaction with SharePoint web services

For additional information on many of these web service calls, see Marc Anderson's SPServices documentation

 - [http://spservices.codeplex.com/documentation]










  

  
## Methods

<div id="processListItems"></div>
<h2>
  <code>processListItems(model, responseXML, options, options.factory, options.filter, options.mapping, options.mode, options.target)</code>

</h2>

Post processing of data after returning list items from server



<table class="table" style="margin:0;">
  <thead>
    <tr>
      <th>Param</th>
      <th>Type</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    
    <tr>
      <td>
        model
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        <p>reference to allow updating of model</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        responseXML
        
        
      </td>
      <td>
        
  <code>xml</code>
      </td>
      <td>
        <p>Resolved promise from web service call</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        options.factory
        
        
      </td>
      <td>
        
  <code>function</code>
      </td>
      <td>
        <p>Constructor Function</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.filter
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        <p>Optional : XML filter</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.mapping
        
        
      </td>
      <td>
        
  <code>Array</code>
      </td>
      <td>
        <p>Field definitions</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.mode
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        <p>Options for what to do with local list data array in store [replace, update, return]</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.target
        
        
      </td>
      <td>
        
  <code>Array</code>
      </td>
      <td>
        <p>Optionally pass in array to update</p>

        
      </td>
    </tr>
    
  </tbody>
</table>









<div id="parseFieldVersionHistoryResponse
Takes an XML response from SharePoint webservice and returns an array of field versions"></div>
<h2>
  <code>parseFieldVersionHistoryResponse
Takes an XML response from SharePoint webservice and returns an array of field versions(responseXML, fieldDefinition)</code>

</h2>





<table class="table" style="margin:0;">
  <thead>
    <tr>
      <th>Param</th>
      <th>Type</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    
    <tr>
      <td>
        responseXML
        
        
      </td>
      <td>
        
  <code>xml</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        fieldDefinition
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        <p>defined in model for the list</p>

        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>Array</code> 




<div id="getFieldVersionHistory"></div>
<h2>
  <code>getFieldVersionHistory(payload, fieldDefinition)</code>

</h2>

Returns the version history for a field in a list item



<table class="table" style="margin:0;">
  <thead>
    <tr>
      <th>Param</th>
      <th>Type</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    
    <tr>
      <td>
        payload
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        fieldDefinition
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        <p>field definition object from the model</p>

        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>promise</code> - Array of list item changes for the specified field




<div id="getCollection"></div>
<h2>
  <code>getCollection(options, options.operation, options.operation, options.operation, options.operation, options.operation, options.operation, options.operation, options.filterNode)</code>

</h2>

Used to handle any of the Get[filterNode]Collection calls to SharePoint



<table class="table" style="margin:0;">
  <thead>
    <tr>
      <th>Param</th>
      <th>Type</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    
    <tr>
      <td>
        options
        
        
      </td>
      <td>
        
  <code>Object</code>
      </td>
      <td>
        <p>object used to extend payload and needs to include all SPServices required attributes</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.operation
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        <p>GetUserCollectionFromSite</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.operation
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        <p>GetGroupCollectionFromSite</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.operation
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        <p>GetGroupCollectionFromUser @requires options.userLoginName</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.operation
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        <p>GetUserCollectionFromGroup @requires options.groupName</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.operation
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        <p>GetListCollection</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.operation
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        <p>GetViewCollection @requires options.listName</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.operation
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        <p>GetAttachmentCollection @requires options.listName &amp; options.ID</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.filterNode
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        <p>Value to iterate over in returned XML
        if not provided it&#39;s extracted from the name of the operation
        ex: Get[User]CollectionFromSite, &quot;User&quot; is used as the filterNode</p>

        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>promise</code> when resolved will contain an array of the requested collection




<div id="serviceWrapper"></div>
<h2>
  <code>serviceWrapper(options)</code>

</h2>

Generic wrapper for any SPServices web service call
Check http://spservices.codeplex.com/documentation for details on expected parameters for each operation



<table class="table" style="margin:0;">
  <thead>
    <tr>
      <th>Param</th>
      <th>Type</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    
    <tr>
      <td>
        options
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        <p>payload params</p>

        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>promise</code> If options.filterNode is provided, returns XML parsed by node name
     Otherwise returns the server response




<div id="getList"></div>
<h2>
  <code>getList(options, options.listName, options.webURL)</code>

</h2>

Returns all list settings for each list on the site



<table class="table" style="margin:0;">
  <thead>
    <tr>
      <th>Param</th>
      <th>Type</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    
    <tr>
      <td>
        options
        
        
      </td>
      <td>
        
  
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        options.listName
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        options.webURL
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        <p>returns info for specified site (optional)</p>

        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>object</code> promise




<div id="deleteAttachment"></div>
<h2>
  <code>deleteAttachment(options, options.listItemId, options.url, options.listName)</code>

</h2>

Deletes and attachment on a list item



<table class="table" style="margin:0;">
  <thead>
    <tr>
      <th>Param</th>
      <th>Type</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    
    <tr>
      <td>
        options
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        options.listItemId
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        options.url
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        options.listName
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>promise</code> 




<div id="getView"></div>
<h2>
  <code>getView(options, options.listName, options.viewName, options.webURL)</code>

</h2>

Returns details of a SharePoint list view



<table class="table" style="margin:0;">
  <thead>
    <tr>
      <th>Param</th>
      <th>Type</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    
    <tr>
      <td>
        options
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        options.listName
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        options.viewName
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        <p><em>*</em>Formatted as a GUID ex: &#39;{37388A98-534C-4A28-BFFA-22429276897B}&#39;</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.webURL
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>object</code> promise




<div id="executeQuery"></div>
<h2>
  <code>executeQuery(model, query, query.offlineXML, options, options.deferred, options.target, options.offlineXML)</code>

</h2>

Takes in the model and a query that



<table class="table" style="margin:0;">
  <thead>
    <tr>
      <th>Param</th>
      <th>Type</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    
    <tr>
      <td>
        model
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        query
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        query.offlineXML
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        <p>Allow an offline file to spe specified when a query is created</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        options.deferred
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        <p>A reference to a deferred object</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.target
        
        
      </td>
      <td>
        
  <code>Array</code>
      </td>
      <td>
        <p>The target destination for returned entities</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.offlineXML
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        <p>Alternate location to XML data file</p>

        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>object</code> promise - Returns reference to model




<div id="removeEntityFromLocalCache"></div>
<h2>
  <code>removeEntityFromLocalCache(entityArray, entityId)</code>

</h2>

Removes an entity from the local cache if it exists



<table class="table" style="margin:0;">
  <thead>
    <tr>
      <th>Param</th>
      <th>Type</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    
    <tr>
      <td>
        entityArray
        
        
      </td>
      <td>
        
  <code>Array</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        entityId
        
        
      </td>
      <td>
        
  <code>Number</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>boolean</code> 




<div id="retrieveChangeToken"></div>
<h2>
  <code>retrieveChangeToken(responseXML)</code>

</h2>

Returns the change token from the xml response of a GetListItemChangesSinceToken query
Note: this attribute is only found when using 'GetListItemChangesSinceToken'



<table class="table" style="margin:0;">
  <thead>
    <tr>
      <th>Param</th>
      <th>Type</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    
    <tr>
      <td>
        responseXML
        
        
      </td>
      <td>
        
  <code>xml</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
  </tbody>
</table>









<div id="retrievePermMask"></div>
<h2>
  <code>retrievePermMask(responseXML)</code>

</h2>

Returns the text representation of the users permission mask
Note: this attribute is only found when using 'GetListItemChangesSinceToken'



<table class="table" style="margin:0;">
  <thead>
    <tr>
      <th>Param</th>
      <th>Type</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    
    <tr>
      <td>
        responseXML
        
        
      </td>
      <td>
        
  <code>xml</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
  </tbody>
</table>









<div id="processDeletionsSinceToken"></div>
<h2>
  <code>processDeletionsSinceToken(responseXML, entityArray)</code>

</h2>

GetListItemChangesSinceToken returns items that have been added as well as deleted so we need
to remove the deleted items from the local cache



<table class="table" style="margin:0;">
  <thead>
    <tr>
      <th>Param</th>
      <th>Type</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    
    <tr>
      <td>
        responseXML
        
        
      </td>
      <td>
        
  <code>xml</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        entityArray
        
        
      </td>
      <td>
        
  <code>Array</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
  </tbody>
</table>









<div id="stringifySharePointMultiSelect"></div>
<h2>
  <code>stringifySharePointMultiSelect(value, idProperty)</code>

</h2>

Turns an array of, typically {lookupId: someId, lookupValue: someValue}, objects into a string
of delimited id's that can be passed to SharePoint for a multi select lookup or multi user selection
field



<table class="table" style="margin:0;">
  <thead>
    <tr>
      <th>Param</th>
      <th>Type</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    
    <tr>
      <td>
        value
        
        
      </td>
      <td>
        
  <code>object[]</code>
      </td>
      <td>
        <p>Array of objects</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        idProperty
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        <p>ID attribute</p>

        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>string</code> 




<div id="createValuePair"></div>
<h2>
  <code>createValuePair(fieldDefinition, value)</code>

</h2>

Uses a field definition from a model to properly format a value for submission to SharePoint



<table class="table" style="margin:0;">
  <thead>
    <tr>
      <th>Param</th>
      <th>Type</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    
    <tr>
      <td>
        fieldDefinition
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        value
        
        
      </td>
      <td>
        
  <code>*</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>Array</code> - [fieldName, fieldValue]




<div id="generateValuePairs"></div>
<h2>
  <code>generateValuePairs(fieldDefinitions, item)</code>

</h2>

Uses provided field definitions to pull value pairs for desired attributes



<table class="table" style="margin:0;">
  <thead>
    <tr>
      <th>Param</th>
      <th>Type</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    
    <tr>
      <td>
        fieldDefinitions
        
        
      </td>
      <td>
        
  <code>Array</code>
      </td>
      <td>
        <p>definitions from the model</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        item
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        <p>list item</p>

        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>Array</code> 




<div id="addUpdateItemModel"></div>
<h2>
  <code>addUpdateItemModel(model, item, options, options.mode, options.buildValuePairs, options.valuePairs)</code>

</h2>

Adds or updates a list item based on if the item passed in contains an id attribute



<table class="table" style="margin:0;">
  <thead>
    <tr>
      <th>Param</th>
      <th>Type</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    
    <tr>
      <td>
        model
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        item
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        options
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        options.mode
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        <p>[update, replace, return]</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.buildValuePairs
        
        
      </td>
      <td>
        
  <code>boolean</code>
      </td>
      <td>
        <p>automatically generate pairs based on fields defined in model</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.valuePairs
        
        
      </td>
      <td>
        
  <code>Array</code>
      </td>
      <td>
        <p>precomputed value pairs to use instead of generating them</p>

        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>object</code> promise




<div id="deleteItemModel"></div>
<h2>
  <code>deleteItemModel(model, item, options, options.target)</code>

</h2>

Typically called directly from a list item, removes the list item from SharePoint
and the local cache



<table class="table" style="margin:0;">
  <thead>
    <tr>
      <th>Param</th>
      <th>Type</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    
    <tr>
      <td>
        model
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        <p>model of the list item</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        item
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        <p>list item</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        options.target
        
        
      </td>
      <td>
        
  <code>Array</code>
      </td>
      <td>
        <p>optional location to search through and remove the local cached copy</p>

        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>object</code> promise



  
  






