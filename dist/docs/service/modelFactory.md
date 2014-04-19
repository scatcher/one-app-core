---
layout: "docs_api"
version: ""
versionHref: ""
path: "api/service/modelFactory/"

title: "modelFactory"
header_sub_title: "Service in module Model"
doc: "modelFactory"
docType: "service"
---

<div class="improve-docs">
  <a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/model_srvc.js#L3'>
    View Me
  </a>
</div>
<div class="improve-docs">
  <a href='http://github.com/scatcher/sp-angular/edit/master/app/scripts/services/model_srvc.js#L3'>
    Edit Me
  </a>
</div>





<h1 class="api-title">

  modelFactory



</h1>





The `modelFactory` provides a common base prototype for Model, Query, and List Item.










  

  
## Methods


<h4>
  <code>registerChange(model)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/model_srvc.js#L122'>view</a>


If online and sync is being used, notify all online users that a change has been made



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
        <p>event</p>

        
      </td>
    </tr>
    
  </tbody>
</table>













<h4>
  <code>resolvePermissions(permissionsMask)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/model_srvc.js#L958'>view</a>


Converts permMask into something usable to determine permission level for current user



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
        permissionsMask
        
        
      </td>
      <td>
        
  <code>string</code>
      </td>
      <td>
        <p>The WSS Rights Mask is an 8-byte, unsigned integer that specifies
the rights that can be assigned to a user or site group. This bit mask can have zero or more flags set.</p>

        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>object</code> property for each permission level identifying if current user has rights (true || false)
link: http://sympmarc.com/2009/02/03/permmask-in-sharepoint-dvwps/
link: http://spservices.codeplex.com/discussions/208708



<h2 id="example">Example</h2><p>&#39;0x0000000000000010&#39;</p>




  
  






