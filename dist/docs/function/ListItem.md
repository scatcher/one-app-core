---
layout: "docs_api"
version: ""
versionHref: ""
path: "api/function/ListItem/"

title: "ListItem"
header_sub_title: "Function in module scripts"
doc: "ListItem"
docType: "function"
---

<div class="improve-docs">
  <a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/model_srvc.js#L559'>
    View Me
  </a>
</div>
<div class="improve-docs">
  <a href='http://github.com/scatcher/sp-angular/edit/master/app/scripts/services/model_srvc.js#L559'>
    Edit Me
  </a>
</div>





<h1 class="api-title">

  ListItem



</h1>





Constructor for creating a list item which inherits CRUD functionality that can be called directly from obj










  

  
## Methods


<h4>
  <code>getDataService()</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/model_srvc.js#L569'>view</a>


Allows us to reference when out of scope






* Returns: 
  <code>object</code> 








<h4>
  <code>saveChanges(options)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/model_srvc.js#L580'>view</a>


Updates record directly from the object



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
        <p>optionally pass params to the dataService</p>

        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>promise</code> 








<h4>
  <code>saveFields(fieldArray)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/model_srvc.js#L602'>view</a>


Saves a named subset of fields back to SharePoint
Alternative to saving all fields



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
        fieldArray
        
        
      </td>
      <td>
        
  <code>array</code>
      </td>
      <td>
        <p>array of internal field names that should be saved to SharePoint</p>

        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>promise</code> 








<h4>
  <code>deleteItem(options)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/model_srvc.js#L636'>view</a>


Deletes record directly from the object and removes record from user cache



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
        <p>optionally pass params to the dataService</p>

        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>promise</code> 








<h4>
  <code>validateEntity(options, options.toast)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/model_srvc.js#L658'>view</a>


Helper function that passes the current item to Model.validateEntity



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
        options.toast
        
        
      </td>
      <td>
        
  <code>boolean</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>boolean</code> 








<h4>
  <code>getAttachmentCollection()</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/model_srvc.js#L674'>view</a>


Requests all attachments for the object






* Returns: 
  <code>promise</code> - resolves with attachment collection








<h4>
  <code>deleteAttachment(url)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/model_srvc.js#L691'>view</a>


Delete an attachment using the attachment url



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
        url
        
        
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
  <code>promise</code> - containing updated attachment collection








<h4>
  <code>resolvePermissions()</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/model_srvc.js#L708'>view</a>









* Returns: 
  <code>Object</code> Contains properties for each permission level evaluated for current user(true | false)








<h4>
  <code>getFieldVersionHistory(fieldNames)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/model_srvc.js#L720'>view</a>


Returns the version history for a specific field



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
        fieldNames
        
        
      </td>
      <td>
        
  <code>string[]</code>
      </td>
      <td>
        <p>the js mapped name of the fields (ex: [title])</p>

        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>promise</code> - containing array of changes






  
  






