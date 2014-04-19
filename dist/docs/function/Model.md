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
  <a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/model_srvc.js#L24'>
    View Me
  </a>
</div>
<div class="improve-docs">
  <a href='http://github.com/scatcher/sp-angular/edit/master/app/scripts/services/model_srvc.js#L24'>
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


<h4>
  <code>getAllListItems()</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/model_srvc.js#L96'>view</a>


Inherited from Model constructor
Gets all list items in the current list, processes the xml, and adds the data to the model
Uses new deferred object instead of resolving self.ready






* Returns: 
  <code>promise</code> 



<h2>Example</h2><code>
    <p>Taken from a fictitious projectsModel.js
    projectModel.getAllListItems().then(function(entities) {
        //Do something with all of the returned entities
        $scope.projects = entities;
    };</p>

</code>





<h4>
  <code>addNewItem(entity, options)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/model_srvc.js#L134'>view</a>


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



<h2>Example</h2><code>
    <p>{title: &quot;Some Title&quot;, date: new Date()}</p>

</code><code>
    <p>Taken from a fictitious projectsModel.js
   projectModel.addNewItem({
          title: &#39;A Project&#39;,
          customer: {lookupValue: &#39;My Customer&#39;, lookupId: 123},
          description: &#39;This is the project description&#39;
       }).then(function(newEntityFromServer) {
           //The local query cache is automatically updated but any other dependent logic can go here
   };</p>

</code>





<h4>
  <code>registerQuery(queryOptions, queryOptions.name)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/model_srvc.js#L165'>view</a>


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



<h2>Example</h2><code>
    <p>Could be placed on the projectModel and creates the query but doesn&#39;t call it</p>
<p>   projectModel.registerQuery({
       name: &#39;primary&#39;,
       query: &#39;&#39; +
           &#39;<Query>&#39; +
           &#39;   <OrderBy>&#39; +
           &#39;       <FieldRef Name="Title" Ascending="TRUE"/>&#39; +
           &#39;   </OrderBy>&#39; +
           &#39;</Query>&#39;
   });</p>

</code><code>
    <p>To call the query or check for changes since the last call</p>
<p>   projectModel.executeQuery(&#39;primary&#39;).then(function(entities) {
       //We now have a reference to array of entities stored in the local cache
       //These inherit from the ListItem prototype as well as the Project prototype on the model
       $scope.projects = entities;
   });</p>

</code><code>
    <p>Advanced functionality that would allow us to dynamically create queries for list items with a
lookup field associated with a specific project id.  Let&#39;s assume this is on the projectTasksModel.</p>
<p>   model.queryByProjectId(projectId) {
       // Unique query name
       var queryKey = &#39;pid&#39; + projectId;</p>
<pre><code>   // Register project query if it doesn&#39;t exist
   if (!_.isObject(model.queries[queryKey])) {
       model.registerQuery({
           name: queryKey,
           query: &#39;&#39; +
               &#39;&lt;Query&gt;&#39; +
               &#39;   &lt;OrderBy&gt;&#39; +
               &#39;       &lt;FieldRef Name=&quot;ID&quot; Ascending=&quot;TRUE&quot;/&gt;&#39; +
               &#39;   &lt;/OrderBy&gt;&#39; +
               &#39;   &lt;Where&gt;&#39; +
               &#39;       &lt;And&gt;&#39; +
           // Prevents any records from being returned if user doesn&#39;t have permissions on project
               &#39;           &lt;IsNotNull&gt;&#39; +
               &#39;               &lt;FieldRef Name=&quot;Project&quot;/&gt;&#39; +
               &#39;           &lt;/IsNotNull&gt;&#39; +
           // Return all records for the project matching param projectId
               &#39;           &lt;Eq&gt;&#39; +
               &#39;               &lt;FieldRef Name=&quot;Project&quot; LookupId=&quot;TRUE&quot;/&gt;&#39; +
               &#39;               &lt;Value Type=&quot;Lookup&quot;&gt;&#39; + projectId + &#39;&lt;/Value&gt;&#39; +
               &#39;           &lt;/Eq&gt;&#39; +
               &#39;       &lt;/And&gt;&#39; +
               &#39;   &lt;/Where&gt;&#39; +
               &#39;&lt;/Query&gt;&#39;
       });
   }
   //Still using execute query but now we have a custom query
   return model.executeQuery(queryKey);</code></pre>
<p>   };</p>

</code>





<h4>
  <code>getQuery(queryName)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/model_srvc.js#L247'>view</a>


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
  <code>object</code> query - see Query prototype for properties



<h2>Example</h2><code>
    <p><pre>
var primaryQuery = projectModel.getQuery();
</pre>
:--or--:</p>

</code><code>
    <p><pre>
var primaryQuery = projectModel.getQuery(&#39;primary&#39;);
</pre>
:--or--:</p>

</code><code>
    <pre>
var namedQuery = projectModel.getQuery('customQuery');
</pre>
</code>





<h4>
  <code>getCache(queryName)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/model_srvc.js#L285'>view</a>


Helper function that return the local cache for a named query if provided, otherwise
it returns the cache for the primary query for the model.  Useful if you know the query
has already been resolved and there's no need to check SharePoint for changes.



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



<h2>Example</h2><code>
    <p>var primaryQueryCache = projectModel.getCache();</p>
<p>--or--</p>
<p>var primaryQueryCache = projectModel.getCache(&#39;primary&#39;);</p>
<p>--or--</p>
<p>var namedQueryCache = projectModel.getCache(&#39;customQuery&#39;);</p>

</code>





<h4>
  <code>executeQuery(queryName, options)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/model_srvc.js#L317'>view</a>


The primary method for retrieving data from a query registered on a model.  It returns a promise
which resolves to the local cache after post processing entities with constructors.



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



<h2>Example</h2><code>
    <p>To call the query or check for changes since the last call.
         projectModel.executeQuery(&#39;MyCustomQuery&#39;).then(function(entities) {
             //We now have a reference to array of entities stored in the local cache
             //These inherit from the ListItem prototype as well as the Project prototype on the model
             $scope.subsetOfProjects = entities;
         })</p>

</code>





<h4>
  <code>isInitialised()</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/model_srvc.js#L344'>view</a>


Methods which allows us to easily determine if we've successfully made any queries this session






* Returns: 
  <code>boolean</code> 








<h4>
  <code>searchLocalCache(value, options, options.propertyPath, options.cacheName, options.localCache, options.rebuildIndex)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/model_srvc.js#L355'>view</a>


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













<h4>
  <code>createEmptyItem(overrides)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/model_srvc.js#L421'>view</a>


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








<h4>
  <code>generateMockData(options, options.quantity, options.permissionLevel, options.staticValue)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/model_srvc.js#L444'>view</a>


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













<h4>
  <code>validateEntity(entity, options, options.toast)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/model_srvc.js#L481'>view</a>


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






  
  




<h2 id="example">Example</h2><p>Taken from a fictitious projectsModel.js</p>
<pre>
var model = new modelFactory.Model({
       factory: Project,
       list: {
           guid: '{PROJECT LIST GUID}',
           title: 'Projects',
           customFields: [
               { internalName: 'Title', objectType: 'Text', mappedName: 'title', readOnly: false },
               { internalName: 'Customer', objectType: 'Lookup', mappedName: 'customer', readOnly: false },
               { internalName: 'ProjectDescription', objectType: 'Text', mappedName: 'projectDescription', readOnly: false },
               { internalName: 'Status', objectType: 'Text', mappedName: 'status', readOnly: false },
               { internalName: 'TaskManager', objectType: 'User', mappedName: 'taskManager', readOnly: false },
               { internalName: 'ProjectGroup', objectType: 'Lookup', mappedName: 'group', readOnly: false },
               { internalName: 'CostEstimate', objectType: 'Currency', mappedName: 'costEstimate', readOnly: false },
               { internalName: 'Active', objectType: 'Boolean', mappedName: 'active', readOnly: false },
               { internalName: 'Attachments', objectType: 'Attachments', mappedName: 'attachments', readOnly: true}
           ]
       }
   });
</pre>


