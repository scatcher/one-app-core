---
layout: "docs_api"
version: ""
versionHref: ""
path: "api/service/syncService/"

title: "syncService"
header_sub_title: "Service in module scripts"
doc: "syncService"
docType: "service"
---

##[syncService]()

Supports 3-way data binding if you decide to incorporate firebase (any change by any user
to a list item is mirrored across users). The data isn't saved to firebase but the change
event is so all subscribers are notified to request an update from SharePoint.


<div class="improve-docs">
  <a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/sync_srvc.js#L3'>
    View Me
  </a>
</div>
<div class="improve-docs">
  <a href='http://github.com/scatcher/sp-angular/edit/master/app/scripts/services/sync_srvc.js#L3'>
    Edit Me
  </a>
</div>





<h3 class="api-title">

  syncService



</h3>





Supports 3-way data binding if you decide to incorporate firebase (any change by any user
to a list item is mirrored across users). The data isn't saved to firebase but the change
event is so all subscribers are notified to request an update from SharePoint.










  

  
## Methods


<h4>
  <code>synchronizeData(model, updateQuery, model, updateQuery)</code>

</h4>
<a href='http://github.com/scatcher/sp-angular/blob/master/app/scripts/services/sync_srvc.js#L14'>view</a>


Constructor to handle notifying models when data is updated


###Params

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
        
  
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        updateQuery
        
        
      </td>
      <td>
        
  
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        model
        
        
      </td>
      <td>
        
  
      </td>
      <td>
        
        
      </td>
    </tr>
    
    <tr>
      <td>
        updateQuery
        
        
      </td>
      <td>
        
  
      </td>
      <td>
        
        
      </td>
    </tr>
    
  </tbody>
</table>






* Returns: 
  <code>object</code> sync



###Example



  
  






