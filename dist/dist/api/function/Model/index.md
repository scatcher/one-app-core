---
layout: "docs_api"
version: ""
versionHref: ""
path: "api/function/Model/"

title: "Model"
header_sub_title: "Function in module Model"
doc: "Model"
docType: "function"
---

<div class="improve-docs">
  <a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/model_srvc.js#L23'>
    View Me
  </a>
</div>
<div class="improve-docs">
  <a href='http://github.com/scatcher/sp-angular/edit/master/app/scripts/services/model_srvc.js#L23'>
    Edit Me
  </a>
</div>





<h1 class="api-title">

  Model



</h1>





Model Constructor
Provides the Following
- adds an empty "data" array
- adds an empty "queries" object
- adds a deferred obj "ready"
- builds "model.list" with constructor
- adds "getAllListItems" function
- adds "addNewItem" function










  <h2 id="usage">Usage</h2>
    
      <code>Model(options, options.factory, options.list, options.list.title, options.list.guid, options.list.customFields)</code>

    

    
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
        options.factory
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        <p>Constructor function for individual list items.</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.list
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        <p>Definition of the list in SharePoint; This object will
be passed to the list constructor to extend further</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.list.title
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        <p>List name, no spaces.  Offline XML file will need to be
named the same (ex: CustomList so xml file would be /dev/CustomList.xml)</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.list.guid
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        <p>Unique SharePoint ID (ex: &#39;{3DBEB25A-BEF0-4213-A634-00DAF46E3897}&#39;)</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.list.customFields
        
        
      </td>
      <td>
        
  <code>object[]</code>
      </td>
      <td>
        <p>Maps SharePoint fields with names we&#39;ll use within the
application.  Identifies field types and formats accordingly.  Also denotes if a field is read only.</p>

        
      </td>
    </tr>
    
  </tbody>
</table>

    

    


  
## Methods

<div id="getAllListItems"></div>
<h2>
  <code>getAllListItems()</code>

</h2>

Inherited from Model constructor
Gets all list items in the current list, processes the xml, and adds the data to the model
Uses new deferred object instead of resolving self.ready






* Returns: 
  <code>promise</code> 




<div id="addNewItem"></div>
<h2>
  <code>addNewItem(entity, options)</code>

</h2>

Creates a new list item in SharePoint



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
        entity
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        <p>Contains attribute to use in the creation of the new list item</p>

        
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
        <p>Pass additional options to the data service.</p>

        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>promise</code> 




<div id="registerQuery"></div>
<h2>
  <code>registerQuery(queryOptions, queryOptions.name)</code>

</h2>

Constructor that allows us create a static query with a reference to the parent model



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
        queryOptions
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        queryOptions.name
        
        
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
  <code>Query</code> 




<div id="getQuery"></div>
<h2>
  <code>getQuery(queryName)</code>

</h2>

Helper function that attempts to locate and return a reference to the requested or catchall query



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
        queryName
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        <p>A unique key to identify this query</p>

        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>object</code> query




<div id="getCache"></div>
<h2>
  <code>getCache(queryName)</code>

</h2>

Helper function that return the local cache for a named query if provided, otherwise
it returns the cache for the primary query for the model



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
        queryName
        
        
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
  <code>Array</code> 




<div id="executeQuery"></div>
<h2>
  <code>executeQuery(queryName, options)</code>

</h2>

Reference to the function which executes a query



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
        queryName
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        <p>A unique key to identify this query</p>

        
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
        <p>Pass options to the data service.</p>

        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>function</code> 




<div id="isInitialised"></div>
<h2>
  <code>isInitialised()</code>

</h2>

Methods which allows us to easily determine if we've successfully made any queries this session






* Returns: 
  <code>boolean</code> 




<div id="searchLocalCache"></div>
<h2>
  <code>searchLocalCache(value, options, options.propertyPath, options.cacheName, options.localCache, options.rebuildIndex)</code>

</h2>

Search functionality that allow for deeply searching an array of objects for the first
record matching the supplied value.  Additionally it maps indexes to speed up future calls.  It
currently rebuilds the mapping when the length of items in the local cache has changed or when the
rebuildIndex flag is set.



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
        
  
      </td>
      <td>
        <p>The value or array of values to compare against</p>

        
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
        options.propertyPath
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        <p>The dot separated propertyPath.</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.cacheName
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        <p>Required if using a data source other than primary cache.</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.localCache
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        <p>Array of objects to search (Default model.getCache()).</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.rebuildIndex
        
        
      </td>
      <td>
        
  <code>boolean</code>
      </td>
      <td>
        <p>Set to ignore previous index and rebuild</p>

        
      </td>
    </tr>
    
  </tbody>
</table>









<div id="createEmptyItem"></div>
<h2>
  <code>createEmptyItem(overrides)</code>

</h2>

Creates an object using the editable fields from the model, all attributes are empty



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
        overrides
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        <p>Optionally extend the new item with specific values.</p>

        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>object</code> 




<div id="generateMockData"></div>
<h2>
  <code>generateMockData(options, options.quantity, options.permissionLevel, options.staticValue)</code>

</h2>

Generates n mock records for testing



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
        options.quantity
        
        
      </td>
      <td>
        
  <code>number</code>
      </td>
      <td>
        <p>The requested number of mock records</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.permissionLevel
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        <p>Sets the mask on the mock records to simulate desired level</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.staticValue
        
        
      </td>
      <td>
        
  <code>boolean</code>
      </td>
      <td>
        <p>by default all mock data is dynamically created but if set, this will
cause static data to be used instead</p>

        
      </td>
    </tr>
    
  </tbody>
</table>









<div id="validateEntity"></div>
<h2>
  <code>validateEntity(entity, options, options.toast)</code>

</h2>

Uses the custom fields defined in an model to ensure each field (required = true) is evaluated
based on field type



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
        entity
        
        
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
        options.toast
        
        
      </td>
      <td>
        
  <code>boolean</code>
      </td>
      <td>
        <p>Should toasts be generated to alert the user of issues</p>

        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>boolean</code> 



  
  






