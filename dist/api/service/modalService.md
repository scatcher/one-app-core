---
layout: "docs_api"
version: ""
versionHref: ""
path: "api/service/modalService/"

title: "modalService"
header_sub_title: "Service in module scripts"
doc: "modalService"
docType: "service"
---

<div class="improve-docs">
  <a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/modal_srvc.js#L3'>
    View Me
  </a>
</div>
<div class="improve-docs">
  <a href='http://github.com/scatcher/sp-angular/edit/master/app/scripts/services/modal_srvc.js#L3'>
    Edit Me
  </a>
</div>





<h1 class="api-title">

  modalService



</h1>





Extends a modal form to include many standard functions










  

  
## Methods

<div id="modalModelProvider"></div>
<h2>
  <code>modalModelProvider(options, options.templateUrl, options.controller, options.expectedArguments)</code>

</h2>

Extends a model to allow us to easily attach a modal form that accepts and injects a
dynamic number of arguments.



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
        <p>Configuration object.</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.templateUrl
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        <p>Reference to the modal view.</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.controller
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        <p>Name of the modal controller.</p>

        
      </td>
    </tr>
    
    <tr>
      <td>
        options.expectedArguments
        
        
      </td>
      <td>
        
  <code>string[]</code>
      </td>
      <td>
        <p>First argument name should be the item being edited.</p>

        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>openModal</code> 




<div id="getPermissions"></div>
<h2>
  <code>getPermissions(entity)</code>

</h2>

Returns an object containing the permission levels for the current user



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
        <p>list item</p>

        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>Object</code> 




<div id="initializeState"></div>
<h2>
  <code>initializeState(entity, options)</code>

</h2>

Creates a state object, populates permissions for curent user, and sets display mode



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
        
  
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        options
        
        
      </td>
      <td>
        
  
      </td>
      <td>
        
        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>Object</code> 




<div id="deleteEntity"></div>
<h2>
  <code>deleteEntity(entity, state, $modalInstance)</code>

</h2>

Prompts for confirmation of deletion, then deletes and closes modal



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
        state
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        $modalInstance
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
  </tbody>
</table>









<div id="saveEntity"></div>
<h2>
  <code>saveEntity(entity, model, state, $modalInstance)</code>

</h2>

Creates a new record if necessary, otherwise updates the existing record



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
        state
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        $modalInstance
        
        
      </td>
      <td>
        
  <code>object</code>
      </td>
      <td>
        
        
      </td>
    </tr>
    
  </tbody>
</table>








  
  






